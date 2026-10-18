/*
 * X (Twitter) iOS 强制最高画质 —— HLS 方案
 *
 * 原理：X App 用 HLS (m3u8) 播视频，视频文件走 video.twimg.com CDN。
 * 拦截 master 播放列表，只留最高码率一档，播放器没得选，只能播最高清。
 * （API 有证书锁定碰不得，只动 CDN。）
 */

function main() {
  let body = null;
  try { body = $response.body; } catch (e) { $done({}); return; }
  // 只处理 master 播放列表（media 播放列表没有 STREAM-INF，直接放行）
  if (!body || body.indexOf('#EXT-X-STREAM-INF') === -1) { $done({}); return; }

  const lines = body.split('\n');
  let bestBw = -1, bestIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/BANDWIDTH=(\d+)/);
    if (m) {
      const bw = parseInt(m[1], 10);
      if (bw > bestBw) { bestBw = bw; bestIdx = i; }
    }
  }
  if (bestIdx < 0 || !lines[bestIdx + 1]) { $done({}); return; }

  // 只保留最高码率一档：STREAM-INF 行 + 下一行的分片列表 URL
  const out = '#EXTM3U\n' + lines[bestIdx] + '\n' + lines[bestIdx + 1].trim() + '\n';
  $done({ body: out });
}

main();
