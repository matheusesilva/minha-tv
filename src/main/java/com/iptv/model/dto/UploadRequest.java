package com.iptv.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class UploadRequest {
    private List<String> urls;
}