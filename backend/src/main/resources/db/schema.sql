-- Schema for Music Management System

-- Category table (分类)
CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description VARCHAR(500) DEFAULT '' COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

-- Song table (歌曲)
CREATE TABLE IF NOT EXISTS song (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '歌曲名称',
    artist VARCHAR(200) DEFAULT '' COMMENT '歌手/艺术家',
    album VARCHAR(200) DEFAULT '' COMMENT '专辑',
    category_id BIGINT DEFAULT NULL COMMENT '分类ID',
    song_number INT DEFAULT 0 COMMENT '歌曲编号',
    lyrics TEXT COMMENT '歌词',
    file_url VARCHAR(500) DEFAULT '' COMMENT '音频文件URL',
    cover_url VARCHAR(500) DEFAULT '' COMMENT '封面URL',
    duration INT DEFAULT 0 COMMENT '时长(秒)',
    play_count INT DEFAULT 0 COMMENT '播放次数',
    favorite TINYINT DEFAULT 0 COMMENT '是否收藏 0否1是',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

-- Playlist table (歌单)
CREATE TABLE IF NOT EXISTS playlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '歌单名称',
    description VARCHAR(500) DEFAULT '' COMMENT '歌单描述',
    cover_url VARCHAR(500) DEFAULT '' COMMENT '歌单封面',
    song_count INT DEFAULT 0 COMMENT '歌曲数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

-- Playlist-Song relation table (歌单歌曲关联)
CREATE TABLE IF NOT EXISTS playlist_song (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    playlist_id BIGINT NOT NULL COMMENT '歌单ID',
    song_id BIGINT NOT NULL COMMENT '歌曲ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_playlist_song (playlist_id, song_id)
);

-- Settings table (设置)
CREATE TABLE IF NOT EXISTS app_setting (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value VARCHAR(500) DEFAULT '',
    description VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
