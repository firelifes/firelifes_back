const { execSync } = require('child_process');

const port = process.argv[2] || '7001';

try { execSync(`pkill -9 -f "midway" 2>/dev/null || true`, { shell: '/bin/bash' }); } catch {}
try { execSync(`pkill -9 -f "mwtsc" 2>/dev/null || true`, { shell: '/bin/bash' }); } catch {}
try { execSync(`pkill -9 -f "wrap.js" 2>/dev/null || true`, { shell: '/bin/bash' }); } catch {}

function getPids() {
  try {
    return execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

for (let round = 1; round <= 5; round++) {
  const pids = getPids();
  if (pids.length === 0) {
    console.log(`[kill-port] 端口 ${port} 已释放`);
    break;
  }
  console.log(`[kill-port] 第${round}轮: 端口 ${port} 被占用 PID=${pids.join(',')}，杀进程中...`);
  execSync(`kill -9 ${pids.join(' ')}`);
  execSync('sleep 1');
}
