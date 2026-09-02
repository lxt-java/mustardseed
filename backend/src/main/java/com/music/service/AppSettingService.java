package com.music.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.music.entity.AppSetting;
import com.music.mapper.AppSettingMapper;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AppSettingService extends ServiceImpl<AppSettingMapper, AppSetting> {

    public Map<String, String> getAllAsMap() {
        List<AppSetting> settings = this.list();
        Map<String, String> map = new HashMap<>();
        for (AppSetting s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return map;
    }

    public String getValue(String key) {
        AppSetting s = this.getOne(new LambdaQueryWrapper<AppSetting>()
                .eq(AppSetting::getSettingKey, key));
        return s != null ? s.getSettingValue() : null;
    }
}
