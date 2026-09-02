package com.music.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.music.entity.Song;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SongMapper extends BaseMapper<Song> {

    @Select("SELECT s.*, c.name as categoryName FROM song s " +
            "LEFT JOIN category c ON s.category_id = c.id " +
            "WHERE s.deleted = 0 " +
            "AND (#{categoryId} IS NULL OR s.category_id = #{categoryId}) " +
            "AND (#{keyword} IS NULL OR s.title LIKE CONCAT('%', #{keyword}, '%') OR s.artist LIKE CONCAT('%', #{keyword}, '%')) " +
            "AND (#{favorite} IS NULL OR s.favorite = #{favorite}) " +
            "ORDER BY s.category_id, s.song_number")
    IPage<Song> selectSongsWithCategory(Page<Song> page,
                                        @Param("categoryId") Long categoryId,
                                        @Param("keyword") String keyword,
                                        @Param("favorite") Integer favorite);

    @Select("SELECT s.*, c.name as categoryName FROM song s " +
            "LEFT JOIN category c ON s.category_id = c.id " +
            "INNER JOIN playlist_song ps ON s.id = ps.song_id " +
            "WHERE s.deleted = 0 AND ps.playlist_id = #{playlistId} " +
            "ORDER BY ps.sort_order, ps.id")
    List<Song> selectSongsByPlaylistId(@Param("playlistId") Long playlistId);
}
