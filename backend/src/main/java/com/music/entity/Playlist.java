package com.music.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("playlist")
public class Playlist {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String coverUrl;
    private Integer songCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    private Integer deleted;
}
