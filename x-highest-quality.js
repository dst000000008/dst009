/*
 * X (Twitter) iOS 强制最高画质播放
 * 原理：MITM 拦截 X API 返回，把每条视频的低清晰度地址全部删掉、
 *      只留最高码率的 mp4，App 没得选，只能播最高画质。
 *
 * 配套 Loon 配置（加到你的配置里）：
 *
 * [Script]
 * X最高画质 = type=http-response,pattern=^https://api\.(x|twitter)\.com/,script-path=<本脚本的URL>,requires-body=true,timeout=30
 *
 * [MitM]
 * hostname = %APPEND% api.x.com, api.twitter.com
 */

function keepHighestQuality(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) keepHighestQuality(item);
    return;
  }
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (key === 'video_info' && val && Array.isArray(val.variants)) {
      const mp4s = val.variants.filter(
        v => v && v.content_type === 'video/mp4' && typeof v.bitrate === 'number'
      );
      // 只有多清晰度时才动手，单清晰度视频原样放行
      if (mp4s.length > 1) {
        mp4s.sort((a, b) => b.bitrate - a.bitrate);
        val.variants = [mp4s[0]];
      }
    } else if (val && typeof val === 'object') {
      keepHighestQuality(val);
    }
  }
}

try {
  const raw = $response.body;
  if (raw) {
    const data = JSON.parse(raw);
    keepHighestQuality(data);
    $done({ body: JSON.stringify(data) });
  } else {
    $done({});
  }
} catch (e) {
  // 解析失败就原样放行，绝不影响正常刷 X
  $done({});
}
