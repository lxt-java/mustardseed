package com.music.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.music.entity.PlaylistSong;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PlaylistSongMapper extends BaseMapper<PlaylistSong> {

    @Select("SELECT MAX(sort_order) FROM playlist_song WHERE playlist_id = #{playlistId} AND deleted = 0")
    Integer getMaxSortOrder(@Param("playlistId") Long playlistId);
}
