package com.iptv.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChannelSearchRequest {
    private List<String> ids;
}
