package com.music.controller;

import com.music.common.Result;
import com.music.service.AppSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/app")
public class AppController {

    @Autowired
    private AppSettingService appSettingService;

    @GetMapping("/info")
    public Result<Map<String, Object>> info() {
        Map<String, Object> info = new java.util.HashMap<>();
        info.put("appName", appSettingService.getValue("app_name"));
        info.put("version", appSettingService.getValue("version"));
        info.put("releaseDate", appSettingService.getValue("release_date"));
        info.put("themeColor", appSettingService.getValue("theme_color"));
        info.put("clientId", UUID.randomUUID().toString());
        return Result.success(info);
    }

    @GetMapping("/settings")
    public Result<Map<String, String>> settings() {
        return Result.success(appSettingService.getAllAsMap());
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        // Use quick SQL via service would be better, but this is simple
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("database", "H2 Embedded");
        stats.put("storage", "Local File System");
        stats.put("uploadEnabled", true);
        return Result.success(stats);
    }
}
