package com.music.controller;

import com.music.common.Result;
import com.music.entity.Playlist;
import com.music.entity.Song;
import com.music.service.PlaylistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/playlists")
public class PlaylistController {

    @Autowired
    private PlaylistService playlistService;

    @GetMapping
    public Result<List<Playlist>> list() {
        return Result.success(playlistService.listAll());
    }

    @GetMapping("/{id}")
    public Result<Playlist> getById(@PathVariable Long id) {
        return Result.success(playlistService.getById(id));
    }

    @GetMapping("/{id}/songs")
    public Result<List<Song>> getSongs(@PathVariable Long id) {
        return Result.success(playlistService.getSongs(id));
    }

    @PostMapping
    public Result<Playlist> create(@RequestBody Playlist playlist) {
        if (playlist.getSongCount() == null) playlist.setSongCount(0);
        playlistService.save(playlist);
        return Result.success(playlist);
    }

    @PutMapping("/{id}")
    public Result<Playlist> update(@PathVariable Long id, @RequestBody Playlist playlist) {
        playlist.setId(id);
        playlistService.updateById(playlist);
        return Result.success(playlist);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        playlistService.removeById(id);
        return Result.success();
    }

    @PostMapping("/{id}/songs")
    public Result<Void> addSong(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long songId = body.get("songId");
        playlistService.addSong(id, songId);
        return Result.success();
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public Result<Void> removeSong(@PathVariable Long id, @PathVariable Long songId) {
        playlistService.removeSong(id, songId);
        return Result.success();
    }
}
