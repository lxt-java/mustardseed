-- Initial data for Music Management System

-- Categories
INSERT INTO category (name, description, sort_order) VALUES
('敬拜·赞美', '赞美敬拜类歌曲', 1),
('流行音乐', '热门流行歌曲', 2),
('经典老歌', '经典怀旧歌曲', 3),
('轻音乐', '放松休闲轻音乐', 4),
('办公专注', '办公环境背景音', 5);

-- Songs for Category 1: 敬拜·赞美
INSERT INTO song (title, artist, album, category_id, song_number, lyrics, file_url, cover_url, duration, favorite) VALUES
('圣哉三一', '赞美诗', '敬拜赞美集', 1, 1, '圣哉圣哉圣哉，全能大主宰...', '', '', 245, 1),
('颂赞三一', '赞美诗', '敬拜赞美集', 1, 2, '来啊我们向耶和华歌唱...', '', '', 210, 0),
('Father, I Adore You', 'Worship', 'English Worship', 1, 3, 'Father, I adore You...', '', '', 180, 1),
('来吧，我们赞美', '赞美诗', '敬拜赞美集', 1, 4, '来吧，我们向耶和华歌唱...', '', '', 260, 0),
('我的心你要称颂耶和华', '赞美诗', '敬拜赞美集', 1, 5, '我的心哪，你要称颂耶和华...', '', '', 280, 1),
('愿你崇高', '赞美诗', '敬拜赞美集', 1, 6, '神啊，愿你崇高过于诸天...', '', '', 225, 0),
('主你真伟大', '赞美诗', '经典圣诗', 1, 7, '我主我神，我每逢举目观看...', '', '', 310, 1),
('我的神我要敬拜你', '赞美诗', '敬拜赞美集', 1, 8, '我的神我要敬拜你...', '', '', 270, 0);

-- Songs for Category 2: 流行音乐
INSERT INTO song (title, artist, album, category_id, song_number, lyrics, file_url, cover_url, duration, favorite) VALUES
('晴天', '周杰伦', '叶惠美', 2, 1, '故事的小黄花，从出生那年就飘着...', '', '', 269, 1),
('稻香', '周杰伦', '魔杰座', 2, 2, '对这个世界如果你有太多的抱怨...', '', '', 223, 1),
('七里香', '周杰伦', '七里香', 2, 3, '窗外的麻雀，在电线杆上多嘴...', '', '', 295, 0),
('演员', '薛之谦', '绅士', 2, 4, '简单点，说话的方式简单点...', '', '', 258, 0),
('光年之外', '邓紫棋', '光年之外', 2, 5, '感受停在我发端的指尖...', '', '', 235, 1),
('起风了', '买辣椒也用券', '起风了', 2, 6, '这一路上走走停停...', '', '', 326, 0),
('海阔天空', 'Beyond', '海阔天空', 2, 7, '今天我寒夜里看雪飘过...', '', '', 326, 1),
('光辉岁月', 'Beyond', '命运派对', 2, 8, '钟声响起归家的讯号...', '', '', 290, 0);

-- Songs for Category 3: 经典老歌
INSERT INTO song (title, artist, album, category_id, song_number, lyrics, file_url, cover_url, duration, favorite) VALUES
('月亮代表我的心', '邓丽君', '经典金曲', 3, 1, '你问我爱你有多深...', '', '', 210, 1),
('甜蜜蜜', '邓丽君', '甜蜜蜜', 3, 2, '甜蜜蜜你笑得甜蜜蜜...', '', '', 198, 0),
('朋友', '周华健', '朋友', 3, 3, '这些年一个人，风也过雨也走...', '', '', 256, 1),
('花心', '周华健', '花心', 3, 4, '花的心藏在蕊中...', '', '', 245, 0),
('吻别', '张学友', '吻别', 3, 5, '前尘往事成云烟...', '', '', 278, 0);

-- Songs for Category 4: 轻音乐
INSERT INTO song (title, artist, album, category_id, song_number, lyrics, file_url, cover_url, duration, favorite) VALUES
('Canon in D', 'Pachelbel', 'Classical Piano', 4, 1, '(纯音乐)', '', '', 300, 1),
('River Flows in You', 'Yiruma', 'First Love', 4, 2, '(纯音乐)', '', '', 210, 1),
('天空之城', '久石让', '久石让精选', 4, 3, '(纯音乐)', '', '', 245, 0),
('卡农', 'George Winston', 'Piano Solos', 4, 4, '(纯音乐)', '', '', 320, 0),
('梦中的婚礼', 'Richard Clayderman', '钢琴精选', 4, 5, '(纯音乐)', '', '', 198, 1);

-- Songs for Category 5: 办公专注
INSERT INTO song (title, artist, album, category_id, song_number, lyrics, file_url, cover_url, duration, favorite) VALUES
('雨声白噪音', '自然之声', '办公专注', 5, 1, '(环境音)', '', '', 600, 0),
('森林鸟鸣', '自然之声', '办公专注', 5, 2, '(环境音)', '', '', 480, 1),
('海浪声', '自然之声', '办公专注', 5, 3, '(环境音)', '', '', 540, 0),
('咖啡馆环境音', '环境音', '办公专注', 5, 4, '(环境音)', '', '', 420, 0),
('Lo-Fi Beats', 'Lo-Fi', 'Study Beats', 5, 5, '(纯音乐)', '', '', 360, 1);

-- Playlists
INSERT INTO playlist (name, description, cover_url, song_count) VALUES
('我喜欢的音乐', '收藏的喜欢的歌曲', '', 8),
('工作背景音', '适合办公时听的音乐', '', 5),
('睡前放松', '睡前放松音乐', '', 3),
('周末精选', '周末轻松听', '', 4);

-- Playlist-Song relations
-- 我喜欢的音乐: 所有 favorite = 1 的歌
INSERT INTO playlist_song (playlist_id, song_id, sort_order) VALUES
(1, 1, 1), (1, 3, 2), (1, 5, 3), (1, 7, 4),
(1, 9, 5), (1, 10, 6), (1, 13, 7), (1, 15, 8),
(1, 21, 9), (1, 23, 10), (1, 26, 11), (1, 28, 12),
(1, 30, 13);

-- 工作背景音
INSERT INTO playlist_song (playlist_id, song_id, sort_order) VALUES
(2, 26, 1), (2, 27, 2), (2, 28, 3), (2, 29, 4), (2, 30, 5);

-- 睡前放松
INSERT INTO playlist_song (playlist_id, song_id, sort_order) VALUES
(3, 26, 1), (3, 27, 2), (3, 29, 3);

-- App settings
INSERT INTO app_setting (setting_key, setting_value, description) VALUES
('app_name', '音乐管家', '应用名称'),
('version', '1.0.0', '版本号'),
('release_date', '2026-09-02', '发布日期'),
('theme_color', '#4f46e5', '主题颜色');
