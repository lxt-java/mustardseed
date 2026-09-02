package com.music.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.music.entity.Category;
import com.music.mapper.CategoryMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService extends ServiceImpl<CategoryMapper, Category> {

    public List<Category> listAll() {
        return this.list(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSortOrder, Category::getId));
    }
}
