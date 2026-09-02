package com.music.controller;

import com.music.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${music.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${music.file-base-url:http://localhost:8080/api/files}")
    private String fileBaseUrl;

    private final SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");

    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return Result.error("文件为空");
        }

        String dateDir = sdf.format(new Date());
        Path dirPath = Paths.get(uploadDir, dateDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String newName = UUID.randomUUID().toString().replace("-", "") + ext;
        Path filePath = dirPath.resolve(newName);
        file.transferTo(filePath.toFile());

        String url = fileBaseUrl + "/" + dateDir + "/" + newName;
        Map<String, String> result = new HashMap<>();
        result.put("url", url);
        result.put("path", filePath.toString());
        result.put("name", originalName);
        result.put("size", String.valueOf(file.getSize()));

        return Result.success(result);
    }
}
