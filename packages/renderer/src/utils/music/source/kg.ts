import { decodeName, formatPlayCount, formatPlayTime, sizeFormate } from '@/utils';
import request from '@/utils/request';
import { responseMsg } from '@/utils/request/message';

// https://www.kugou.com/yy/special/single/1067062.html
const REG_KG_PAGE_LINK = /^.+\/(\d+)\.html(?:\?.*|&.*$|#.*$|$)/;
// script, global = {};
const REG_KG_GLOBAL_RANK = {
  total: /total: '(\d+)',/,
  page: /page: '(\d+)',/,
  limit: /pagesize: '(\d+)',/,
  listData: /global\.features = (\[.+\]);/,
};
// script, global.data = [];
const REG_KG_DATA = /global\.data = (\[.+\]);/;

const kgApi: MusicApi = {
  getHotSearch: async function (): Promise<string[]> {
    const res = await request(
      'http://msearch.kugou.com/api/v3/search/hot_tab?signature=ee44edb9d7155821412d220bcaf509dd&appid=1005&clientver=10026&plat=0',
      {
        headers: {
          dfid: '1ssiv93oVqMp27cirf2CvoF1',
          mid: '156798703528610303473757548878786007104',
          clienttime: '1584257267',
          'kg-rc': '1',
        },
      },
    );
    const body: any = await res.json();
    if (body.errcode !== 0) throw new Error('获取热搜词失败');
    const list: string[] = [];
    body.data.list.forEach((item: any) => {
      item.keywords.forEach((k: any) => {
        list.push(decodeName(k.keyword));
      });
    });
    return list;
  },
  searchMusic: async function (keyword: string, page: number, limit: number): Promise<Pagination<MusicInfo>> {
    keyword = encodeURIComponent(keyword);
    const res = await request(
      `http://ioscdn.kugou.com/api/v3/search/song?keyword=${keyword}&page=${page}&pagesize=${limit}&showtype=10&plat=2&version=7910&tag=1&correct=1&privilege=1&sver=5`,
    );
    const body: any = await res.json();
    if (body.errcode !== 0) throw new Error('搜索歌曲失败');
    const list: MusicInfo[] = [];
    const ids = new Set();
    for (let i = 0; i < body.data.info.length; i++) {
      const item = body.data.info[i];
      const key = item.album_audio_id + item.hash;
      if (ids.has(key)) break;
      ids.add(key);
      list.push(handleMusicData(item));
    }
    const result: Pagination<MusicInfo> = {
      total: body.data.total,
      page: page,
      limit: limit,
      list: list,
    };
    return result;
  },
  getSortList: function (): Promise<MusicSort[]> {
    const list: MusicSort[] = [
      {
        id: '5',
        name: '推荐',
      },
      {
        id: '6',
        name: '最热',
      },
      {
        id: '7',
        name: '最新',
      },
      {
        id: '3',
        name: '热藏',
      },
      {
        id: '8',
        name: '飙升',
      },
    ];
    return Promise.resolve(list);
  },
  getTags: async function (): Promise<Record<string, MusicTag[]>> {
    const res = await request('http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1');
    const body: any = await res.json();
    if (body.status !== 1) throw new Error('获取标签失败');
    const result: Record<string, MusicTag[]> = {};
    const rawData: any = result.body;
    // 处理热门
    result.__hot = Object.keys(rawData.hotTag.data).map((key: any) => {
      const tag = rawData.hotTag.data[key];
      return {
        id: tag.special_id,
        name: tag.special_name,
      };
    });
    // 处理其他
    for (const key in rawData.tagids) {
      result[key] = rawData.tagids[key].data.map((tag: any) => ({
        pid: tag.parent_id,
        pname: tag.pname,
        id: tag.id,
        name: tag.name,
      }));
    }
    return result;
  },
  getPlaylist: async function (sortId: string, tagId: string, page: number): Promise<Pagination<PlaylistInfo>> {
    let res = await request(
      `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1&cdn=cdn&t=5&c=${tagId}`,
    );
    let body: any = await res.json();
    if (body.status !== 1) throw new Error('获取歌单失败');
    const pageInfo: Pagination<PlaylistInfo> = {
      page: body.data.params.p || page,
      limit: body.data.params.pagesize,
      total: body.data.params.total,
      list: [],
    };
    res = await request(
      `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${tagId}&p=${page}`,
    );
    body = await res.json();
    if (body.status !== 1) throw new Error('获取歌单失败');
    pageInfo.list = body.special_db.map((item: any) => ({
      id: 'kg_' + item.specialid,
      name: item.specialname,
      img: item.img || item.imgurl,
      author: item.nickname,
      desc: item.intro,
      playCount: item.total_play_count || formatPlayCount(item.play_count),
      grade: item.grade,
      publicTime: item.publish_time || item.publishtime,
    }));
    return pageInfo;
  },
  getRecommendPlaylist: async function (): Promise<PlaylistInfo[]> {
    const res = await request('http://everydayrec.service.kugou.com/guess_special_recommend', {
      method: 'POST',
      headers: {
        'User-Agent': 'KuGou2012-8275-web_browser_event_handler',
      },
      body: JSON.stringify({
        appid: 1001,
        clienttime: 1566798337219,
        clientver: 8275,
        key: 'f1f93580115bb106680d2375f8032d96',
        mid: '21511157a05844bd085308bc76ef3343',
        platform: 'pc',
        userid: '262643156',
        return_min: 6,
        return_max: 15,
      }),
    });
    const body: any = await res.json();
    if (body.status !== 1) throw new Error('获取推荐歌单失败');
    return body.data.special_list.map((item: any) => ({
      id: 'kg_' + item.specialid,
      name: item.specialname,
      img: item.img || item.imgurl,
      author: item.nickname,
      desc: item.intro,
      playCount: item.total_play_count || formatPlayCount(item.play_count),
      grade: item.grade,
      publicTime: item.publish_time || item.publishtime,
    }));
  },
  getPlaylistDetail: async function (id: string, page: number, limit?: number): Promise<Pagination<MusicInfo>> {
    if (id.includes('special/single/')) {
      // 歌单详情链接
      id = id.replace(REG_KG_PAGE_LINK, '$1');
    } else if (/^\d+$/.test(id)) {
      // 分享的酷狗码
      return getPlaylistDetailByCode(id, page, limit);
    } else if (id.startsWith('kg_')) {
      // 点击歌单
      id = id.replace('kg_', '');
    }
    const res = await request(`http://www2.kugou.kugou.com/yueku/v9/special/single/${id}-5-9999.html`);
    const body: string = await res.text();
    const listData = JSON.parse(body.match(REG_KG_DATA)![1]);
    const list: MusicInfo[] = listData.map((item: any) => handleMusicData(item));
    const pageInfo: Pagination<MusicInfo> = {
      page: page,
      limit: limit || 10000,
      total: list.length,
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
      desc: item.intro,
    }));
    return list;
  },
  getRankDetail: async function (id: string | number, page: number): Promise<Pagination<MusicInfo>> {
    const res = await request(`http://www2.kugou.kugou.com/yueku/v9/rank/home/${page}-${id}.html`);
    const body: string = await res.text();
    const pageInfo: Pagination<MusicInfo> = {
      page: parseInt(body.match(REG_KG_GLOBAL_RANK.page)![1]),
      limit: parseInt(body.match(REG_KG_GLOBAL_RANK.limit)![1]),
      total: parseInt(body.match(REG_KG_GLOBAL_RANK.total)![1]),
      list: [],
    };
    const data: any = JSON.parse(body.match(REG_KG_GLOBAL_RANK.listData)![1]);
    pageInfo.list = data.map((item: any) => handleMusicData(item));
    return pageInfo;
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

const kgSource: MusicSource = {
  id: 'kg',
  name: '酷狗音乐',
  alias: '小苟音乐',
  api: kgApi,
};

/** 处理歌曲数据 */
function handleMusicData(rawData: any): MusicInfo {
  const types: ToneQuality[] = [];
  if (rawData.filesize) {
    types.push({
      type: '128k',
      size: sizeFormate(rawData.filesize),
      audition: rawData.privilege === 10,
      hash: rawData.hash,
    });
  }
  if (rawData['320filesize']) {
    types.push({
      type: '320k',
      size: sizeFormate(rawData['320filesize']),
      audition: rawData['320privilege'] === 10,
      hash: rawData['320hash'],
    });
  } else if (rawData['filesize_320']) {
    types.push({
      type: '320k',
      size: sizeFormate(rawData['filesize_320']),
      audition: rawData['privilege_320'] === 10,
      hash: rawData['hash_320'],
    });
  }
  if (rawData.sqfilesize) {
    types.push({
      type: 'flac',
      size: sizeFormate(rawData.sqfilesize),
      audition: rawData.sqprivilege === 10,
      hash: rawData.sqhash,
    });
  } else if (rawData['filesize_flac']) {
    types.push({
      type: '320k',
      size: sizeFormate(rawData['filesize_flac']),
      audition: rawData['privilege_flac'] === 10,
      hash: rawData['hash_flac'],
    });
  }
  return {
    source: 'kg',
    id: rawData.album_audio_id,
    name: decodeName(rawData.songname),
    singer: decodeName(rawData.singername),
    albumId: rawData.album_id,
    albumName: decodeName(rawData.album_name),
    interval: rawData.duration,
    formatInterval: formatPlayTime(rawData.duration),
    hash: rawData.hash,
    qualityList: types,
  };
}

/** 处理歌曲数据 */
function handleMusicData1(rawData: any): MusicInfo {
  const types: ToneQuality[] = rawData.relate_goods.map((item: any) => {
    let type = '';
    switch (item.bitrate) {
      case 128:
        type = '128k';
        break;
      case 320:
        type = '320k';
        break;
      default:
        type = 'flac';
        break;
    }
    return {
      type: type,
      hash: item.hash,
      size: sizeFormate(item.size),
    };
  });
  return {
    source: 'kg',
    id: rawData.album_audio_id,
    name: decodeName(rawData.name.indexOf(' - ') > -1 ? rawData.name.split(' - ')[1] : rawData.name),
    img: rawData.cover.replace('{size}', '480'),
    singerId: rawData.singerinfo.map((o: any) => o.id).join(','),
    singer: decodeName(rawData.singerinfo.map((o: any) => o.name).join('、')),
    albumId: rawData.album_id,
    albumName: decodeName(rawData.albuminfo.name),
    interval: rawData.timelen / 1000,
    formatInterval: formatPlayTime(rawData.timelen / 1000),
    hash: rawData.hash,
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

export default kgSource;
