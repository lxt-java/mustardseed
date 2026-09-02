package com.music.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.music.common.Result;
import com.music.entity.Song;
import com.music.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/songs")
public class SongController {

    @Autowired
    private SongService songService;

    @GetMapping
    public Result<IPage<Song>> page(
            @RequestParam(required = false) Integer pageNum,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer favorite) {
        return Result.success(songService.pageWithCategory(pageNum, pageSize, categoryId, keyword, favorite));
    }

    @GetMapping("/all")
    public Result<List<Song>> listByPlaylist(@RequestParam(required = false) Long playlistId) {
        if (playlistId != null) {
            return Result.success(songService.listByPlaylist(playlistId));
        }
        // Use a large page size to get all
        IPage<Song> page = songService.pageWithCategory(1, 10000, null, null, null);
        return Result.success(page.getRecords());
    }

    @GetMapping("/favorites")
    public Result<List<Song>> favorites() {
        return Result.success(songService.listFavorites());
    }

    @GetMapping("/{id}")
    public Result<Song> getById(@PathVariable Long id) {
        return Result.success(songService.getById(id));
    }

    @PostMapping
    public Result<Song> create(@RequestBody Song song) {
        if (song.getPlayCount() == null) song.setPlayCount(0);
        if (song.getFavorite() == null) song.setFavorite(0);
        if (song.getDuration() == null) song.setDuration(0);
        if (song.getSongNumber() == null) song.setSongNumber(0);
        songService.save(song);
        return Result.success(song);
    }

    @PutMapping("/{id}")
    public Result<Song> update(@PathVariable Long id, @RequestBody Song song) {
        song.setId(id);
        songService.updateById(song);
        return Result.success(song);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        songService.removeById(id);
        return Result.success();
    }

    @PostMapping("/{id}/favorite")
    public Result<Void> toggleFavorite(@PathVariable Long id) {
        songService.toggleFavorite(id);
        return Result.success();
    }

    @PostMapping("/{id}/play")
    public Result<Void> incrementPlay(@PathVariable Long id) {
        songService.incrementPlayCount(id);
        return Result.success();
    }
}
