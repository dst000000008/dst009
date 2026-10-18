
 * X (Twitter) iOS 强制最高画质 v2
 *
 * v1 有严重 bug：JSON.parse 会把 Twitter 的 64 位雪花 ID（推文/用户 ID）
 * 转成 double 丢失精度，再写回去 ID 全错，导致「帖子暂时无法载入」。
 * v2 改用正则做精准手术：只替换 video_info 里的 variants 数组，
 * 其它字节原样不动。
 *
 * 配套 Loon 配置：
 * [Script]
 * X最高画质 = type=http-response,pattern=^https://api\.(x|twitter)\.com/,script-path=https://raw.githubusercontent.com/dst000000008/dst009/main/x-highest-quality.js,requires-body=true,timeout=30
 * [MitM]
 * hostname = api.x.com, api.twitter.com
 */

function highestMp4(inner) {
  const objs = inner.match(/\{[^{}]*\}/g) || [];
  let best = null, mp4count = 0;
  for (const o of objs) {
    const mB = o.match(/"bitrate":(\d+)/);
    const mC = o.match(/"content_type":"video\/mp4"/);
    const mU = o.match(/"url":"((?:[^"\\]|\\.)*)"/);
    if (mB && mC && mU) {
      mp4count++;
      const br = parseInt(mB[1], 10);
      if (!best || br > best.br) best = { br, raw: o };
    }
  }
  return mp4count > 1 ? best : null;
}

function main() {
  let body = null;
  try { body = $response.body; } catch (e) { $done({}); return; }
  // 没有视频信息的响应直接放行，不浪费时间
  if (!body || body.indexOf('video_info') === -1) { $done({}); return; }

  let changed = false;
  const out = body.replace(
    /"video_info":\{[^}]*?"variants":\[([^\]]*)\]/g,
    (full, inner) => {
      const best = highestMp4(inner);
      if (!best) return full;
      changed = true;
      return full.replace(inner, best.raw);
    }
  );
  $done(changed ? { body: out } : {});
}

main();
