import type { Response } from 'node-fetch';
import { decodeName, formatPlayCount, formatPlayTime, sizeFormate } from '@/utils';
import request from '@/utils/request';
import { responseMsg } from '@/utils/request/message';
import { RequestConfig } from '@/utils/request/options';

const SUCCESS_CODE = 200;
const PAGE_SIZE_PLAYLIST = 36;

const REG_QUALITY = /bitrate:(\d+),format:(\w+),size:([\w.]+)/;
const REG_RELATE_WORD = /RELWORD=(.+)/;
// http://www.kuwo.cn/playlist_detail/2886046289
// https://m.kuwo.cn/h5app/playlist/2736267853?t=qqfriend
const REG_PLAYLIST_DETAIL_LINK = /^.+\/playlist(?:_detail)?\/(\d+)(?:\?.*|&.*$|#.*$|$)/;

const RANK_TYPE = ['热门榜', '品牌榜', '特色榜', '全球榜', '其他'];

let kwToken: string;

const kwApi: MusicApi = {
  init() {
    getToken();
  },
  getHotSearch: async function (): Promise<string[]> {
    const res = await request(
      'http://hotword.kuwo.cn/hotword.s?prod=kwplayer_ar_9.3.0.1&corp=kuwo&newver=2&vipver=9.3.0.1&source=kwplayer_ar_9.3.0.1_40.apk&p2p=1&notrace=0&uid=0&plat=kwplayer_ar&rformat=json&encoding=utf8&tabid=1',
      {
        headers: {
          'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9;)',
        },
      },
    );
    const body: any = await res.json();
    if (body.status !== 'ok') throw new Error('获取热搜词失败');
    return body.tagvalue.map((o: any) => o.key);
  },
  searchMusic: async function (keyword: string, page: number, limit: number): Promise<Pagination<MusicInfo>> {
    keyword = encodeURIComponent(keyword);
    const res = await request(
      `http://search.kuwo.cn/r.s?client=kt&all=${keyword}&pn=${
        page - 1
      }&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`,
    );
    const body: any = await res.json();
    if (body.TOTAL !== '0' && body.SHOW === '0') throw new Error('搜索歌曲失败');
    const list: MusicInfo[] = body.abslist.map((o: any) => handleMusicData(o));
    const result: Pagination<MusicInfo> = {
      total: parseInt(body.TOTAL),
      page: page,
      limit: limit,
      list: list,
    };
    return result;
  },
  getRelatedWords: async function (keyword): Promise<string[]> {
    const res = await tokenRequest(`http://www.kuwo.cn/api/www/search/searchKey?key=${encodeURIComponent(keyword)}`);
    const body: any = await res.json();
    if (body.code !== 200) throw new Error('获取关联词失败');
    return body.data.map((o: any) => {
      const r = o.match(REG_RELATE_WORD);
      return r ? r[1] : '';
    });
  },
  getSortList: function (): Promise<MusicSort[]> {
    const list: MusicSort[] = [
      {
        id: 'new',
        name: '最新',
      },
      {
        id: 'hot',
        name: '最热',
      },
    ];
    return Promise.resolve(list);
  },
  getTags: async function (): Promise<Record<string, MusicTag[]>> {
    const result: Record<string, MusicTag[]> = {};
    const [res, res1] = await Promise.all([
      request('http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmTagList?loginUid=0&loginSid=0&appUid=76039576'),
      request(
        'http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
      ),
    ]);
    // 处理热门
    const body: any = await res.json();
    if (body.code !== SUCCESS_CODE) throw new Error('获取热门标签失败');
    result.__hot = body.data[0].data.map((item: any) => ({
      id: `${item.id}-${item.digest}`,
      name: item.name,
    }));
    // 处理其他
    const body1: any = await res1.json();
    if (body1.code !== SUCCESS_CODE) throw new Error('获取标签失败');
    for (let i = 0; i < body1.data.length; i++) {
      const tagType = body1.data[i];
      result[tagType.name] = tagType.data.map((item: any) => ({
        pid: tagType.id,
        pname: tagType.name,
        id: `${item.id}-${item.digest}`,
        name: item.name,
      }));
    }
    return result;
  },
  getPlaylist: async function (sortId: string, tagId: string, page: number): Promise<Pagination<PlaylistInfo>> {
    let id: string | undefined;
    let type: string | undefined;
    if (tagId && tagId.indexOf('-') > -1) {
      const arr = tagId.split('-');
      id = arr[0];
      type = arr[1];
    }
    let url = '';
    if (!id) {
      url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page}&rn=${PAGE_SIZE_PLAYLIST}&order=${sortId}`;
    } else if (type === '10000') {
      url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&id=${id}&rn=${PAGE_SIZE_PLAYLIST}`;
    } else if (type === '43') {
      url = `http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${id}&prod=pc`;
    } else {
      url = `http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&id=${id}&pn=${page}&rn=${PAGE_SIZE_PLAYLIST}`;
    }
    const res = await request(url);
    const body: any = await res.json();
    if (!id || type === '10000') {
      if (body.code !== SUCCESS_CODE) throw new Error('获取歌单失败');
      const pageInfo: Pagination<PlaylistInfo> = {
        page: body.data.pn || page,
        limit: body.data.rn || PAGE_SIZE_PLAYLIST,
        total: body.data.total || 0,
        list: [],
      };
      pageInfo.list = body.data.data.map((item: any) => ({
        id: `digest-${item.digest}__${item.id}`,
        name: item.name,
        img: item.img,
        author: item.uname,
        desc: item.desc,
        playCount: formatPlayCount(parseInt(item.listencnt)),
        grade: item.favorcnt / 10,
      }));
      return pageInfo;
    }
    if (!body.length) throw new Error('获取歌单失败');
    const list: PlaylistInfo[] = [];
    body.forEach((item: any) => {
      if (!item.label) return;
      list.push(
        ...item.list.map((item: any) => ({
          id: `digest-${item.digest}__${item.id}`,
          name: item.name,
          img: item.img,
          author: item.uname,
          desc: item.desc,
          playCount: item.play_count && formatPlayCount(item.listencnt),
          grade: item.favorcnt && item.favorcnt / 10,
        })),
      );
    });
    const pageInfo: Pagination<PlaylistInfo> = {
      page: page,
      limit: 1000,
      total: 1000,
      list: list,
    };
    return pageInfo;
  },
  getPlaylistDetail: async function (id: string, page: number, limit?: number): Promise<Pagination<MusicInfo>> {
    let digest = '8';
    if (id.startsWith('http')) {
      id = id.replace(REG_PLAYLIST_DETAIL_LINK, '$1');
    } else if (id.startsWith('digest-')) {
      const arr = id.split('__');
      digest = arr[0].replace('digest-', '');
      id = arr[1];
    }
    if (digest === '27') {
      id = id.split('=')[1];
    }
    if (digest === '13') {
      // 专辑
      return this.getAlbumListDetail!(id, page, limit);
    }
    if (digest === '5') {
      const res = await request(
        `http://qukudata.kuwo.cn/q.k?op=query&cont=ninfo&node=${id}&pn=0&rn=1&fmt=json&src=mbox&level=2`,
      );
      const body: any = await res.json();
      if (!body.child || !body.child.length) throw new Error('获取歌单详情失败');
      id = body.child[0].sourceid;
    }
    const res = await request(
      `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${id}&pn=${page - 1}&rn=${
        limit || 1000
      }&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`,
    );
    const body: any = await res.json();
    if (body.result !== 'ok') throw new Error('获取歌单详情失败');
    const list: MusicInfo[] = body.musiclist.map((item: any) => handleMusicData1(item));
    const pageInfo: Pagination<MusicInfo> = {
      page: page,
      limit: body.rn,
      total: body.total,
      list: list,
    };
    return pageInfo;
  },
  getAlbumListDetail: async function (id: string, page: number, limit?: number): Promise<Pagination<MusicInfo>> {
    const res = await request(
      `http://search.kuwo.cn/r.s?pn=${page - 1}&rn=${
        limit || 1000
      }&stype=albuminfo&albumid=${id}&show_copyright_off=0&encoding=utf&vipver=MUSIC_9.1.0`,
    );
    const body: any = await res.json();
    if (body.result !== 'ok') throw new Error('获取专辑详情失败');
    const list: MusicInfo[] = body.musiclist.map((item: any) => handleMusicData2(item, body.name, body.albumid));
    const pageInfo: Pagination<MusicInfo> = {
      page: page,
      limit: body.rn,
      total: body.total,
      list: list,
    };
    return pageInfo;
  },
  getRankList: async function (): Promise<RankInfo[]> {
    const res = await request(
      'http://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=1',
    );
    const body: any = await res.json();
    if (body.status !== 1) throw new Error('获取榜单失败');
    body.data.info.sort((a: any, b: any) => {
      return a.classify - b.classify;
    });
    const list: RankInfo[] = body.data.info.map((item: any) => ({
      id: item.rankid,
      name: item.rankname,
      img: item.imgurl.replace('{size}', '240'),
      type: RANK_TYPE[(item.classify - 1) % RANK_TYPE.length],
      desc: item.intro,
    }));
    return list;
  },
  getRankDetail: async function (id: string | number, page: number): Promise<Pagination<MusicInfo>> {
    throw new Error('Function not implemented.');
    // const res = await request(`http://www2.kugou.kugou.com/yueku/v9/rank/home/${page}-${id}.html`);
    // const body: string = await res.text();
    // const pageInfo: Pagination<MusicInfo> = {
    //   page: parseInt(body.match(REG_KG_GLOBAL_RANK.page)![1]),
    //   limit: parseInt(body.match(REG_KG_GLOBAL_RANK.limit)![1]),
    //   total: parseInt(body.match(REG_KG_GLOBAL_RANK.total)![1]),
    //   list: [],
    // };
    // const data: any = JSON.parse(body.match(REG_KG_GLOBAL_RANK.listData)![1]);
    // pageInfo.list = data.map((item: any) => handleMusicData(item));
    // return pageInfo;
  },
  getMusicUrl: async function (musicInfo: MusicInfo, type: string): Promise<string> {
    const quality = musicInfo.qualityList.find((o: any) => o.type === type);
    if (quality == null) return '';
    const res = await request(
      `https://wwwapi.kugou.com/yy/index.php?r=play/getdata&hash=B51C10F9E28D48FE659A8ABA88FB3EDC&dfid=3x8bVr2mf0cs2mCOlL0HpsP0&appid=1014&mid=6d4364a0be0c9655bf3eaa63e5cec1ab&platid=4&album_id=${musicInfo.albumId}&album_audio_id=${musicInfo.id}&_=1653490770485`,
    );
    const body: any = await res.json();
    if (body.status !== 1) throw new Error(responseMsg.fail);
    return body.data.play_url;
  },
  getPic: function (musicInfo: MusicInfo): Promise<string> {
    throw new Error('Function not implemented.');
  },
  getLyric: function (musicInfo: MusicInfo): Promise<LyricInfo> {
    throw new Error('Function not implemented.');
  },
  getComment: function (musicInfo: MusicInfo, page: number, limit: number): Promise<any> {
    throw new Error('Function not implemented.');
  },
  getSourceMusicLink: function (info: MusicInfo): string {
    return `https://www.kugou.com/song/#hash=${info.hash}&album_id=${info.albumId}`;
  },
  getSourcePlaylistLink: function (id: string | number): string {
    if (typeof id == 'string') id = id.replace('kg__', '');
    return `https://www.kugou.com/yy/special/single/${id}.html`;
  },
  getSourceRankLink: function (id: string | number): string {
    if (typeof id == 'string') id = id.replace('kg__', '');
    return `https://www.kugou.com/yy/rank/home/1-${id}.html`;
  },
};

const kwSource: MusicSource = {
  id: 'kg',
  name: '酷我音乐',
  alias: '小蜗音乐',
  api: kwApi,
};

/** 获取Token */
async function getToken() {
  const tokenRes = await request('http://www.kuwo.cn/');
  const headers = tokenRes.headers.raw();
  kwToken = headers['set-cookie'][0].match(/kw_token=(\w+)/)![1];
}

/** 带Token的请求 */
async function tokenRequest(url: string, config?: RequestConfig): Promise<Response> {
  if (!kwToken) {
    await getToken();
  }
  config = {
    headers: {
      Referer: 'http://www.kuwo.cn/',
      csrf: kwToken,
      cookie: 'kw_token=' + kwToken,
    },
    ...config,
  };
  return request(url, config);
}

/** 处理歌曲数据 */
function handleMusicData(rawData: any): MusicInfo {
  const types: ToneQuality[] = [];
  const infoArr = rawData.MINFO.split(';');
  for (let i = 0; i < infoArr.length; i++) {
    if (!infoArr[i]) continue;
    const regInfo = infoArr[i].match(REG_QUALITY);
    switch (regInfo[2]) {
      case 'flac':
        types.push({ type: 'flac', size: regInfo[3] });
        break;
      // case 'ape':
      //   break
      case 'mp3':
        switch (regInfo[1]) {
          case '320':
            types.push({ type: '320k', size: regInfo[3] });
            break;
          case '192':
          case '128':
            types.push({ type: '128k', size: regInfo[3] });
            break;
        }
        break;
    }
  }
  types.reverse();
  const duration = Number.isNaN(rawData.DURATION) ? 0 : parseInt(rawData.DURATION);
  return {
    source: 'kg',
    id: rawData.MUSICRID.replace('MUSIC_', ''),
    name: decodeName(rawData.SONGNAME),
    singer: decodeName(rawData.ARTIST).replace(/&/g, '、'),
    albumId: rawData.ALBUMID ? decodeName(rawData.ALBUMID) : '',
    albumName: rawData.ALBUM ? decodeName(rawData.ALBUM) : '',
    interval: duration,
    formatInterval: formatPlayTime(rawData.duration),
    hash: rawData.hash,
    qualityList: types,
  };
}

/** 处理歌曲数据 */
function handleMusicData1(rawData: any): MusicInfo {
  const types: ToneQuality[] = [];
  const infoArr = rawData.MINFO.split(';');
  for (let i = 0; i < infoArr.length; i++) {
    if (!infoArr[i]) continue;
    const regInfo = infoArr[i].match(REG_QUALITY);
    switch (regInfo[2]) {
      case 'flac':
        types.push({ type: 'flac', size: regInfo[3] });
        break;
      // case 'ape':
      //   break
      case 'mp3':
        switch (regInfo[1]) {
          case '320':
            types.push({ type: '320k', size: regInfo[3] });
            break;
          case '192':
          case '128':
            types.push({ type: '128k', size: regInfo[3] });
            break;
        }
        break;
    }
  }
  types.reverse();
  return {
    source: 'kg',
    id: rawData.id,
    name: decodeName(rawData.name),
    singer: decodeName(rawData.artist).replace(/&/g, '、'),
    albumId: rawData.albumid,
    albumName: decodeName(rawData.album),
    interval: parseInt(rawData.duration),
    formatInterval: formatPlayTime(parseInt(rawData.duration)),
    qualityList: types,
  };
}

/** 处理专辑歌曲数据 */
function handleMusicData2(rawData: any, albumName: string, albumId: string): MusicInfo {
  const types: ToneQuality[] = [];
  const formats = rawData.formats.split('|');
  if (formats.includes('MP3128')) {
    types.push({ type: '128k', size: '' });
  }
  if (formats.includes('MP3H')) {
    types.push({ type: '320k', size: '' });
  }
  if (formats.includes('ALFLAC')) {
    types.push({ type: 'flac', size: '' });
  }
  return {
    source: 'kg',
    id: rawData.id,
    name: decodeName(rawData.name),
    singer: decodeName(rawData.artist).replace(/&/g, '、'),
    albumId: albumId,
    albumName: albumName,
    interval: parseInt(rawData.duration),
    formatInterval: formatPlayTime(parseInt(rawData.duration)),
    qualityList: types,
  };
}

/** 通过酷狗码获取歌单 */
async function getPlaylistDetailByCode(code: string, page: number, limit?: number): Promise<Pagination<MusicInfo>> {
  if (limit == undefined) limit = 300;
  // 通过酷狗码，获取歌单基本信息
  const res = await request('http://t.kugou.com/command/', {
    method: 'POST',
    headers: {
      'KG-RC': '1',
      'KG-THash': 'network_super_call.cpp:3676261689:379',
      'User-Agent': '',
    },
    body: JSON.stringify({
      appid: 1001,
      clientver: 9020,
      mid: '21511157a05844bd085308bc76ef3343',
      clienttime: 640612895,
      key: '36164c4015e704673c588ee202b9ecb8',
      data: code,
    }),
  });
  const body: any = await res.json();
  if (body.status !== 1) throw new Error('获取歌单详情失败');

  const res1 = await request(
    `https://pubsongscdn.kugou.com/v2/get_other_list_file?appid=1001&clientver=10053&plat=3&type=1&module=NONE&page=${page}&pagesize=${limit}&global_collection_id=${body.data.info.global_collection_id}&signature=2aad3eda6d097b9789afb2207231fed8`,
  );
  const body1: any = await res1.json();
  if (body1.status !== 1) throw new Error('获取歌单详情失败');
  const list: MusicInfo[] = body1.data.info.map((item: any) => handleMusicData1(item));
  const pageInfo: Pagination<MusicInfo> = {
    page: page,
    limit: limit,
    total: body.data.info.count,
    list: list,
  };
  return pageInfo;
}

export default kwSource;
