import axios from 'axios';

const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';

export default class YouTubeDataService {
    static async getChannelList(accessToken: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            const channels = r.data.items.map((item: any) => {
                return {
                    id: item.id,
                    title: item.snippet.title,
                    thumbnailURI: item.snippet.thumbnails.default.url,
                };
            });

            return {
                channels,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getVideoList(accessToken: string) {
        async function getChannels() {
            const r = await axios({
                method: 'GET',
                url: 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log(r.data);
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }
            return r.data;
        }

        async function getPlaylistItems(id: string) {
            const r = await axios({
                method: 'GET',
                url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=' + id,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log(r.data);
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }
            return r.data.items;
        }

        async function getVideos(videoIds: string[]) {
            const r = await axios({
                method: 'GET',
                url: `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log(r.data);
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return r.data.items;
        }

        try {
            const channel = await getChannels();
            const uploadsChannelId = channel.items[0].contentDetails.relatedPlaylists.uploads;
            const playlistItems = await getPlaylistItems(uploadsChannelId);
            const videoIds = playlistItems.map((item: any) => {
                console.log(item);
                return item.contentDetails.videoId;
            });
            const videos = await getVideos(videoIds);

            return {
                videos: videos.map((item: any) => {
                    return {
                        id: item.id,
                        title: item.snippet.title,
                        thumbnailURI: item.snippet.thumbnails.default.url,
                    };
                }),
            };
        } catch (error) {
            return { error };
        }
    }
}
