package com.music.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.music.entity.Song;
import com.music.mapper.SongMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SongService extends ServiceImpl<SongMapper, Song> {

    @Autowired
    private SongMapper songMapper;

    public IPage<Song> pageWithCategory(Integer pageNum, Integer pageSize,
                                        Long categoryId, String keyword, Integer favorite) {
        Page<Song> page = new Page<>(pageNum != null ? pageNum : 1,
                                     pageSize != null ? pageSize : 50);
        return songMapper.selectSongsWithCategory(page, categoryId, keyword, favorite);
    }

    public List<Song> listByPlaylist(Long playlistId) {
        return songMapper.selectSongsByPlaylistId(playlistId);
    }

    public List<Song> listFavorites() {
        return list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Song>()
                .eq(Song::getFavorite, 1)
                .orderByDesc(Song::getUpdatedAt));
    }

    @Transactional
    public boolean toggleFavorite(Long id) {
        Song song = this.getById(id);
        if (song == null) return false;
        song.setFavorite(song.getFavorite() == 1 ? 0 : 1);
        return this.updateById(song);
    }

    @Transactional
    public boolean incrementPlayCount(Long id) {
        Song song = this.getById(id);
        if (song == null) return false;
        song.setPlayCount((song.getPlayCount() == null ? 0 : song.getPlayCount()) + 1);
        return this.updateById(song);
    }
}
