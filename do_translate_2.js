const fs = require('fs');

let content = fs.readFileSync('bot.js', 'utf8');

const dict = [
  ['(trống)', '(empty)'],
  ['trước reply tiếp theo', 'before next reply'],
  ['ngơi ', ''],
  ['Tiếp tục làm việc...', 'Continuing work...'],
  ['Session tồn at - bỏ qua đăng nhập', 'Session exists - skipping login'],
  ['Session tồn at - bỏ qua post nhập', 'Session exists - skipping login'],
  ['Đã thử sort theo Newest', 'Attempted to sort by Newest'],
  ['Đang tắt bots...', 'Shutting down bots...'],
  ['Thoát vòng lặp hiện at', 'Exiting current loop']
];

for (const [vi, en] of dict) {
  content = content.split(vi).join(en);
}

fs.writeFileSync('bot.js', content, 'utf8');
console.log('Translated part 2 successfully!');
