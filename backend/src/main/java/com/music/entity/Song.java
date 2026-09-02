package com.music.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("song")
public class Song {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String artist;
    private String album;
    private Long categoryId;
    private Integer songNumber;
    private String lyrics;
    private String fileUrl;
    private String coverUrl;
    private Integer duration;
    private Integer playCount;
    private Integer favorite;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private String categoryName;
}
