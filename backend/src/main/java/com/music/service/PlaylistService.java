package com.music.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.music.entity.Playlist;
import com.music.entity.PlaylistSong;
import com.music.entity.Song;
import com.music.mapper.PlaylistMapper;
import com.music.mapper.PlaylistSongMapper;
import com.music.mapper.SongMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaylistService extends ServiceImpl<PlaylistMapper, Playlist> {

    @Autowired
    private PlaylistSongMapper playlistSongMapper;

    @Autowired
    private SongMapper songMapper;

    public List<Playlist> listAll() {
        return this.list(new LambdaQueryWrapper<Playlist>()
                .orderByDesc(Playlist::getCreatedAt));
    }

    public List<Song> getSongs(Long playlistId) {
        return songMapper.selectSongsByPlaylistId(playlistId);
    }

    @Transactional
    public boolean addSong(Long playlistId, Long songId) {
        // Check exists
        PlaylistSong exists = playlistSongMapper.selectOne(
                new LambdaQueryWrapper<PlaylistSong>()
                        .eq(PlaylistSong::getPlaylistId, playlistId)
                        .eq(PlaylistSong::getSongId, songId));
        if (exists != null) return false;

        Integer maxSort = playlistSongMapper.getMaxSortOrder(playlistId);
        PlaylistSong ps = new PlaylistSong();
        ps.setPlaylistId(playlistId);
        ps.setSongId(songId);
        ps.setSortOrder((maxSort == null ? 0 : maxSort) + 1);
        boolean result = playlistSongMapper.insert(ps) > 0;

        // Update song count
        if (result) {
            updateSongCount(playlistId);
        }
        return result;
    }

    @Transactional
    public boolean removeSong(Long playlistId, Long songId) {
        int rows = playlistSongMapper.delete(
                new LambdaQueryWrapper<PlaylistSong>()
                        .eq(PlaylistSong::getPlaylistId, playlistId)
                        .eq(PlaylistSong::getSongId, songId));
        if (rows > 0) {
            updateSongCount(playlistId);
            return true;
        }
        return false;
    }

    private void updateSongCount(Long playlistId) {
        Long count = playlistSongMapper.selectCount(
                new LambdaQueryWrapper<PlaylistSong>()
                        .eq(PlaylistSong::getPlaylistId, playlistId));
        Playlist pl = this.getById(playlistId);
        if (pl != null) {
            pl.setSongCount(count.intValue());
            this.updateById(pl);
        }
    }
}
