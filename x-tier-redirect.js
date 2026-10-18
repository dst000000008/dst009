/*
 * X (Twitter) iOS 强制高码率 —— 分片重定向方案 v4
 *
 * 原理：App 从 video.twimg.com 拉 .m4s 分片，URL 形如
 *   /amplify_video/{vid}/vid/avc1/{码率档}/{码率档+3000}/{分辨率}/{hash}.m4s
 * 脚本记住每个视频见过的最高码率档，低档请求 302 重定向到最高档。
 * 只动视频分片（/vid/），音频（/aud/）不动。
 */

function main() {
  const url = $request.url;
  const m = url.match(/\/amplify_video\/(\d+)\/vid\/avc1\/(\d+)\/(\d+)\//);
  if (!m) { $done({}); return; }

  const vid = m[1];
  const tier = parseInt(m[2], 10);
  const key = 'x_max_tier_' + vid;
  const stored = $persistentStore.read(key);
  const maxTier = stored ? parseInt(stored, 10) : 0;

  if (tier >= maxTier) {
    if (tier > maxTier) $persistentStore.write(String(tier), key);
    $done({}); // 已是最高档（或新高），放行
    return;
  }

  // 低档 → 302 到最高档（码率数字与其+3000的配对一起换）
  const newUrl = url.replace(
    `/vid/avc1/${tier}/${m[3]}/`,
    `/vid/avc1/${maxTier}/${maxTier + 3000}/`
  );
  $done({
    response: {
      status: 302,
      headers: { 'Location': newUrl },
      body: ''
    }
  });
}

main();
