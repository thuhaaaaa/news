const fs = require('fs');

const items = [
  { match: "Cập nhật nhanh", query: "A professional minimal news website header background" },
  { match: "Không gian sống xanh", query: "luxury eco-friendly modern green apartment building" },
  { match: "mở rộng quốc lộ 13", query: "highway construction and traffic in Vietnam" },
  { match: "Lật xe khách", query: "ambulance at night accident highway" },
  { match: "Chủ tịch Quốc hội", query: "parliament meeting building interior politics" },
  { match: "cấm xe máy xăng", query: "motorcycles on heavy traffic street asia pollution" },
  { match: "giải cơ phòng đột quỵ", query: "hospital room doctor consulting patient stroke care" },
  { match: "tan máu bẩm sinh", query: "pediatric doctor checking a child patient care" },
  { match: "rá soát điểm ngập", query: "flooded street in city heavy rain" },
  { match: "nộp hồ sơ trực tuyến", query: "young person typing on laptop filing online paperwork" },
  { match: "cây xanh và khu đi bộ", query: "pedestrian walking path green trees modern city" },
  { match: "Laptop AI thế hệ", query: "modern sleek silver laptop on desk glowing AI interface" },
  { match: "Nhịp sống TP", query: "Ho Chi Minh city busy street traffic afternoon" },
  { match: "tuyến metro mới", query: "modern subway metro train station passenger" },
  { match: "biến động giá tiêu", query: "supermarket aisle fresh vegetables and price tags" },
  { match: "thể thao đáng nhớ", query: "stadium crowd cheering active sports moment" },
  { match: "nghệ thuật lớn", query: "live concert stage musicians lights audience" },
  { match: "Đội tuyển Việt Nam", query: "Vietnam soccer football national team on stadium" },
  { match: "Ngoại hạng Anh", query: "premier league football match action stadium" },
  { match: "chạy đêm tại TP", query: "night marathon runners city lights" },
  { match: "ven sông lúc bình", query: "people jogging walking morning park river sunrise" },
  { match: "Dòng xe đông đúc", query: "morning rush hour heavy car traffic city" },
  { match: "Công nhân tất bật", query: "construction workers building site sunny day" },
  { match: "thư giãn cuối tuần", query: "family relaxing picnic weekend green park lake" },
  { match: "Lớp học ngoại khóa", query: "children learning outdoor extracurricular activity" },
  { match: "quán cà phê làm nơi", query: "young freelancer working laptop modern coffee shop" },
  { match: "địa điểm du lịch gần", query: "beautiful homestay countryside Vietnam travel getaway" },
  { match: "live show âm nhạc", query: "acoustic live show music outdoor stage evening" },
  { match: "kỹ năng mềm trước khi", query: "group university students discussing project soft skills" },
  { match: "trải nghiệm cho học", query: "primary school students practical science outdoor activity" },
  { match: "Thư viện trường học", query: "modern school library students reading books" },
  { match: "AI xuất hiện trong", query: "person using futuristic mobile app UI with AI glowing" },
  { match: "xác thực hai lớp", query: "smartphone screen showing 2FA code security lock" },
  { match: "Startup Việt tìm", query: "startup team having meeting office whiteboard" },
  { match: "Du lịch hè", query: "beautiful tropical beach resort summer vacation" },
  { match: "Smartwatch mới", query: "close up modern smartwatch fitness health interface" }
];

async function run() {
  let html = fs.readFileSync('index.html', 'utf8');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Find the text loosely
    const idx = html.indexOf(item.match);
    if (idx === -1) {
      console.log("NOT FOUND text: " + item.match);
      continue;
    }

    // Work backwards to find the nearest <img> tag
    const imgMatch = html.lastIndexOf('<img', idx);
    if (imgMatch !== -1) {
      const closing = html.indexOf('>', imgMatch);
      const fullImg = html.substring(imgMatch, closing + 1);

      const srcMatch = fullImg.match(/src="([^"]+)"/);
      if (srcMatch) {
         let imgId = 'pollination-' + i + '.jpg';
         console.log('Fetching for ', item.query, ' -> ', imgId);
         const promptUrl = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(item.query) + '?width=600&height=400&nologo=true';
         
         const res = await fetch(promptUrl);
         const buffer = await res.arrayBuffer();
         fs.writeFileSync('images/' + imgId, Buffer.from(buffer));
         
         // Replace ONLY this specific img src instance around idx
         const chunkBefore = html.substring(0, closing + 1);
         const chunkAfter = html.substring(closing + 1);
         const replacedChunk = chunkBefore.replace(srcMatch[1], 'images/' + imgId);
         html = replacedChunk + chunkAfter;
      }
    }
  }

  fs.writeFileSync('index.html', html);
  console.log('Done!');
}

run();
