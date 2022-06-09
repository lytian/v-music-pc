declare const SourceType = 'bd' | 'kg' | 'kw' | 'mg' | 'tx' | 'wy';

/** 歌曲源 */
declare interface MusicSource {
  id: string;
  name: string;
  alias: string;
  api: MusicApi;
}

/** 分页器 */
declare interface Pagination<T> {
  // 当前页
  page: number;
  // 页数
  limit: number;
  // 总数
  total: number;
  // 分页列表
  list: T[];
  // 扩展属性
  [key: string]: any;
}

/** 音质 */
declare interface ToneQuality {
  // 音质类型
  type: string;
  // 音质大小
  size: string;
  // 试听
  audition?: boolean;
  // 歌曲hash，kg源
  hash?: string;
  // 歌曲strMediaMid，tx源
  strMediaMid?: string;
  // 歌曲albumMid，tx源
  albumMid?: string;
  // 歌曲copyrightId，mg源
  copyrightId?: string;
  // 歌曲lrcUrl，mg源
  lrcUrl?: string;
}

/** 歌曲内容 */
declare interface MusicInfo {
  // 源
  source: SourceType;
  // 歌曲ID
  id: number | string;
  // 歌曲名称
  name: string;
  // 图片
  img?: string;
  // 艺术家ID
  singerId?: number | string;
  // 艺术家
  singer: string;
  // 专辑ID
  albumId?: number | string;
  // 歌手
  albumName?: string;
  // 歌曲时长
  interval?: number;
  // 歌曲时长，例：03:55
  formatInterval?: string;
  // 歌曲hash，kg源
  hash?: string;
  // 歌曲可用音质
  qualityList: ToneQuality[];
}

/** 排序 */
declare interface MusicSort {
  id: string;
  name: string;
}

/** 标签 */
declare interface MusicTag {
  pid?: string;
  pname?: string;
  id: string;
  name: string;
}

/** 歌单 */
declare interface PlaylistInfo {
  id: number | string;
  name: string;
  img: string;
  author: string;
  desc: string;
  playCount: string;
  gradle?: number;
  publicTime?: string;
}

/** 榜单 */
declare interface RankInfo {
  id: string | number;
  name: string;
  thumb?: string;
  type?: string;
  desc?: string;
}

/** 歌词 */
declare interface LyricInfo {
  lyric: string;
  tlyric?: string;
  // 离线歌词
  lxlyric?: string;
}

/** 评论 */
declare interface CommentInfo {
  id: number | string;
  // 内容
  text: string;
  // 时间
  time: string;
  // 用户
  userName: string;
  // 头像
  avatar: string;
  // 用户ID
  userId: number | string;
  // 喜欢数
  likedCount: number | string;
  // 回复
  reply?: CommentInfo[];
}

/** 歌曲Api */
declare interface MusicApi {
  /**
   * 初始化
   */
  init?: () => void;

  /**
   * 热搜词
   * @returns {string[]} 热搜词列表
   */
  getHotSearch: () => Promise<string[]>;

  /**
   * 关联词
   * @returns {string[]} 热搜词列表
   */
  getRelatedWords?: (keyword: string) => Promise<string[]>;

  /**
   * 搜索歌曲
   * @param {string} keyword 关键词
   * @param {number} page 当前分页
   * @param {number} limit 分页数
   * @returns {Pagination<MusicInfo>} 歌曲分页列表
   */
  searchMusic: (keyword: string, page: number, limit: number) => Promise<Pagination<MusicInfo>>;

  /**
   * 排序列表
   * @returns {MusicSort[]} 排序类型列表
   */
  getSortList: () => Promise<MusicSort[]>;

  /**
   * 标签
   * @returns {Record<string, MusicTag[]>} 标签类名、标签列表
   */
  getTags: () => Promise<Record<string, MusicTag[]>>;

  /**
   * 歌单
   * @param {string} sortId 排序ID
   * @param {string} tagId 标签ID
   * @param {number} page 当前分页
   * @returns {Pagination<PlaylistInfo>} 歌曲分页列表
   */
  getPlaylist: (sortId: string, tagId: string, page: number) => Promise<Pagination<PlaylistInfo>>;

  /**
   * 推荐歌单
   * @returns {PlaylistInfo[]} 歌单列表
   */
  getRecommendPlaylist?: () => Promise<PlaylistInfo[]>;

  /**
   * 歌单详情
   * @param {string} id 歌单ID
   * @param {number} page 当前分页
   * @param {number} limit 分页数
   * @returns {Pagination<MusicInfo>} 歌单分页列表
   */
  getPlaylistDetail: (id: string, page: number, limit?: number) => Promise<Pagination<MusicInfo>>;

  /**
   * 榜单
   * @returns {RankInfo[]} 榜单列表
   */
  getRankList: () => Promise<RankInfo[]>;

  /**
   * 榜单的歌曲
   * @param {string} id 榜单ID
   * @param {number} page 当前分页
   * @returns {Pagination<MusicInfo>} 榜单歌曲分页列表
   */
  getRankDetail: (id: number | string, page: number) => Promise<Pagination<MusicInfo>>;

  /**
   * 专辑的歌曲
   * @param {string} id 专辑ID
   * @param {number} page 当前分页
   * @param {number} limit 分页数
   * @returns {Pagination<MusicInfo>} 歌单分页列表
   */
  getAlbumListDetail?: (id: string, page: number, limit?: number) => Promise<Pagination<MusicInfo>>;

  /**
   * 歌曲播放地址
   * @returns {string} 歌曲播放Url
   */
  getMusicUrl: (musicInfo: MusicInfo, type: string) => Promise<string>;

  /**
   * 歌曲图片
   * @returns {string} 歌曲图片Url
   */
  getPic: (musicInfo: MusicInfo) => Promise<string>;

  /**
   * 歌曲歌词
   * @returns {LyricInfo} 歌词内容
   */
  getLyric: (musicInfo: MusicInfo) => Promise<LyricInfo>;

  /**
   * 获取歌曲的评论
   * @returns {Pagination<CommentInfo} 评论分页数据
   */
  getComment: (musicInfo: MusicInfo, page: number, limit: number) => Promise<Pagination<CommentInfo>>;

  /**
   * 获取评论的回复
   * @returns {Pagination<CommentInfo>} 评论分页数据
   */
  getReplyComment?: (
    musicInfo: MusicInfo,
    commentId: number | string,
    page: number,
    limit: number,
  ) => Promise<Pagination<CommentInfo>>;

  /**
   * 歌区源地址
   */
  getSourceMusicLink?: (info: MusicInfo) => String;

  /**
   * 歌单源地址
   */
  getSourcePlaylistLink?: (id: string | number) => String;

  /**
   * 排行源地址
   */
  getSourceRankLink?: (id: string | number) => String;
}
