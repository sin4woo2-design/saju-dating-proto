import "dotenv/config";
import { google } from "googleapis";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });

const TISTORY_FOLDER_ID = "16VnD4AOgcpPpZK-81FNRAVFVD3gpuruX";

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function getDocEndIndex(documentId) {
  const d = await docs.documents.get({ documentId });
  const body = d.data.body?.content || [];
  return body[body.length - 1]?.endIndex || 2;
}

async function replaceDocContent(documentId, text) {
  const endIndex = await getDocEndIndex(documentId);
  const requests = [];

  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    });
  }

  requests.push({
    insertText: {
      location: { index: 1 },
      text,
    },
  });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}

function rewrittenArticle(placeTitle) {
  return `${placeTitle}\n\n` +
`이 글은 시니어 독자가 실제로 이동하고 이용할 때 필요한 정보를 중심으로 정리한 재작성 원고입니다.\n` +
`과장 표현 없이, 방문 전 확인해야 할 점과 동선·휴식·식사 포인트를 우선으로 안내합니다.\n` +
`처음 방문하는 장소일수록 “짧게 보고, 자주 쉬고, 무리하지 않기” 원칙이 만족도를 크게 높여줍니다.\n\n` +
`1) 방문 전 체크\n` +
`- 운영시간, 휴무일, 주차 가능 여부는 방문 당일 공식 채널로 다시 확인하세요.\n` +
`- 계단/경사로/엘리베이터 유무를 확인하면 이동 피로를 줄일 수 있습니다.\n` +
`- 대기 시간이 긴 장소라면 오픈 시간대 또는 평일 이른 시간 방문이 편합니다.\n` +
`- 날씨 변화가 큰 날은 실내 동선 비중을 높여 계획하는 것이 안전합니다.\n\n` +
`2) 시니어 관점 동선 추천\n` +
`- 처음 30~40분은 가볍게 둘러보며 좌석, 화장실, 휴식 공간 위치를 먼저 파악하세요.\n` +
`- 이동 거리가 길다면 중간 휴식을 1회 이상 넣어 무리하지 않는 것이 좋습니다.\n` +
`- 사진 촬영이나 쇼핑은 마지막에 몰아서 하기보다 구간별로 나누면 피로가 덜합니다.\n` +
`- 동선은 “입구-핵심 구역-휴식-마무리” 순으로 단순하게 잡으면 체력 관리가 쉬워집니다.\n\n` +
`3) 식사/카페 이용 팁\n` +
`- 너무 짠 음식, 단 음식 위주로 한 번에 먹기보다 물과 함께 천천히 드세요.\n` +
`- 카페인은 오후 늦게 과하게 마시지 않는 편이 밤잠에 유리합니다.\n` +
`- 장시간 앉아 있었다면 1시간마다 3~5분 정도 가볍게 일어나 스트레칭하세요.\n` +
`- 메뉴를 고를 때는 소화 부담이 적은 조합을 우선하면 귀가 후 컨디션이 훨씬 좋습니다.\n\n` +
`4) 안전하고 편한 방문을 위한 포인트\n` +
`- 미끄러운 바닥, 조도가 낮은 구간, 혼잡 구간은 특히 주의가 필요합니다.\n` +
`- 낯선 장소에서는 짐을 한쪽 손에 무겁게 들기보다 백팩/크로스백이 낫습니다.\n` +
`- 동행자와 함께라면 만날 위치를 미리 정해두면 이동이 훨씬 편합니다.\n` +
`- 오래 서 있어야 하는 구간이 있다면 중간에 앉을 수 있는 지점을 미리 확보하세요.\n\n` +
`5) 이렇게 다녀오면 만족도가 높습니다\n` +
`- 목표를 크게 잡지 말고 “핵심 2~3개만” 즐긴다는 기준으로 계획하세요.\n` +
`- 돌아와서 피로가 남지 않으면 다음 일정까지 컨디션을 유지하기 좋습니다.\n` +
`- 재방문 의사가 생기면 그 장소는 이미 내 취향과 생활 리듬에 맞는 곳입니다.\n` +
`- 무리하지 않고 기분 좋게 끝냈다면, 그게 가장 성공적인 하루 일정입니다.\n\n` +
`체크리스트(출발 전 1분 점검)\n` +
`- 물, 필요한 약, 얇은 겉옷 챙기기\n` +
`- 휴식 지점 1~2곳 미리 확인하기\n` +
`- 귀가 시간 너무 늦어지지 않게 기준 정하기\n` +
`- 동행자와 연락 방법/만남 지점 공유하기\n\n` +
`마무리\n` +
`${placeTitle}은(는) 빠르게 소비하기보다, 천천히 즐길수록 만족도가 올라가는 장소입니다.\n` +
`시니어 기준으로는 “이동 피로 관리 + 휴식 포인트 확보 + 과하지 않은 식사” 세 가지만 지켜도 훨씬 편하게 다녀올 수 있습니다.\n` +
`처음부터 완벽할 필요는 없습니다. 오늘은 한 가지 원칙만 적용해도 다음 방문이 더 편해집니다.\n\n` +
`※ 안내: 본문은 일반 생활정보이며, 건강 상태에 따라 필요한 조정은 개인별로 다를 수 있습니다.`;
}

const healthTopics = [
  "시니어 수면의 질 높이는 저녁 루틴 5분",
  "아침 공복에 시니어가 하면 좋은 습관 vs 피해야 할 습관",
  "식곤증 줄이는 시니어 점심 식단 구성법",
  "혈당 급상승 줄이는 식사 순서(당뇨 전단계 포함)",
  "목·어깨 뻐근함 완화하는 저강도 스트레칭 10분",
  "허리 통증 있는 시니어가 피해야 할 동작 3가지",
  "장 건강·변비 완화를 위한 식이섬유+수분 섭취법",
  "탈수 예방을 위한 시니어 물 마시는 타이밍",
  "카페인 섭취 마감 시간: 밤잠 살리는 기준",
  "불안·긴장 완화 3분 호흡법(혈압 관리 보조)",
  "면역력 관리를 위한 수면·영양·가벼운 운동 우선순위",
  "야식 생각날 때 혈당 부담 적은 대체 간식",
  "오래 앉아있는 시니어를 위한 1시간 리셋 루틴(낙상예방 포함)",
  "주말에 무너진 생활리듬, 월요일에 복구하는 방법",
];

function healthArticle(topic, idx) {
  return `[시니어 건강 ${String(idx + 1).padStart(2, "0")}] ${topic}\n\n` +
`한 번에 완벽하게 바꾸기보다, 오늘 바로 실천 가능한 작은 습관 1~2개를 만드는 방식이 시니어 건강관리에서 가장 오래 갑니다.\n` +
`이 글은 과장된 표현 없이, 일상에서 적용 가능한 방법을 블로그에 바로 붙여 넣을 수 있도록 정리했습니다.\n\n` +
`왜 이 주제가 중요한가\n` +
`시니어 시기에는 잠, 식사, 활동량, 수분, 스트레스 관리가 서로 연결되어 있습니다.\n` +
`한 가지가 무너지면 다른 생활 리듬도 연쇄적으로 흔들리기 쉽습니다.\n` +
`그래서 핵심은 대단한 비법보다 "매일 유지 가능한 기본"을 만드는 것입니다.\n\n` +
`핵심 요약\n` +
`- 무리한 변화보다 지속 가능한 루틴이 우선입니다.\n` +
`- 몸 상태가 좋지 않은 날에는 강도를 낮추고 회복을 먼저 챙기세요.\n` +
`- 약 복용 중이거나 기존 질환이 있다면 개인 상황에 맞춰 조정하세요.\n` +
`- 기록을 남기면 내 몸의 반응 패턴을 빨리 찾을 수 있습니다.\n\n` +
`실천 가이드\n` +
`1. 시작 기준을 낮추세요\n` +
`처음부터 길게 하려 하면 며칠 못 가기 쉽습니다. 3분, 5분, 한 동작부터 시작하면 실패율이 크게 줄어듭니다.\n\n` +
`2. 하루 일정에 붙여서 실행하세요\n` +
`알람만으로는 습관이 오래가지 않습니다. 식사 전, 샤워 전, 잠들기 전처럼 이미 있는 루틴에 연결하면 훨씬 안정적으로 유지됩니다.\n\n` +
`3. 몸의 신호를 먼저 보세요\n` +
`어지러움, 통증, 심한 피로가 있으면 강행하지 말고 강도를 낮추거나 쉬는 것이 맞습니다. 꾸준함은 "쉬어야 할 때 쉬는 판단"까지 포함합니다.\n\n` +
`4. 기록은 짧고 간단하게\n` +
`체크박스 1개만 있어도 충분합니다. “오늘 했는지/못 했는지”만 기록해도 일주일 뒤 패턴이 보입니다.\n\n` +
`5. 다음 날 이어가기 쉬운 마무리\n` +
`한 번에 다 하려 하지 말고, 내일 바로 이어갈 수 있게 70% 정도에서 마무리하세요. 장기적으로 훨씬 효율적입니다.\n\n` +
`상황별 적용 예시\n` +
`- 컨디션 좋은 날: 목표를 1단계만 늘려서 성취감을 확보합니다.\n` +
`- 컨디션 보통인 날: 원래 하던 기준만 지키고 추가 욕심은 내려놓습니다.\n` +
`- 컨디션 나쁜 날: 실행 시간을 절반으로 줄이고 회복 루틴(수분/휴식/가벼운 호흡)을 먼저 합니다.\n\n` +
`실전 체크리스트\n` +
`- 오늘의 목표 1가지 정하기\n` +
`- 실행 시간 고정하기(아침/점심/저녁 중 1개)\n` +
`- 끝난 뒤 물 한 잔 + 짧은 메모 남기기\n` +
`- 주 1회는 쉬는 날 포함하기\n` +
`- 2주마다 "잘 맞는 습관/안 맞는 습관" 재정리하기\n\n` +
`자주 하는 실수\n` +
`첫째, 시작부터 기준을 높게 잡는 것. 둘째, 하루 못 했다고 계획 전체를 포기하는 것.\n` +
`셋째, 수면/식사/활동을 따로 관리해서 연결성을 놓치는 것입니다.\n` +
`작게 시작하고, 끊기더라도 다음 날 바로 복귀하면 충분히 좋은 흐름을 만들 수 있습니다.\n\n` +
`블로그용 마무리 문장\n` +
`${topic}의 핵심은 “강하게”가 아니라 “오래”입니다.\n` +
`오늘은 딱 한 가지부터, 내 몸에 맞는 속도로 시작해 보세요.\n` +
`작은 루틴이 쌓이면 몸 상태와 생활 리듬이 함께 안정됩니다.\n\n` +
`※ 안내: 본문은 일반 건강정보이며 진단/치료를 대체하지 않습니다. 증상 지속 시 의료진 상담을 권장합니다.\n\n` +
`추가 팁\n` +
`건강 루틴은 “실천→기록→조정”의 반복이 핵심입니다.\n` +
`이번 주에는 한 가지, 다음 주에는 또 한 가지를 더하는 방식으로 천천히 확장해 보세요.\n` +
`두세 달만 지나도 이전보다 훨씬 안정적인 생활 리듬을 체감하게 됩니다.`;
}

async function findDocsByPrefix(prefix) {
  const q = `name contains '${esc(prefix)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${TISTORY_FOLDER_ID}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 100 });
  return r.data.files || [];
}

async function findDocByExactName(name) {
  const q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${TISTORY_FOLDER_ID}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(name) {
  const found = await findDocByExactName(name);
  if (found) return found;

  const c = await docs.documents.create({ requestBody: { title: name } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: TISTORY_FOLDER_ID, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

function fitToAround2000(text) {
  const min = 1900;
  const max = 2150;

  const addon =
    "\n\n실천 유지 팁\n" +
    "- 완벽하게 하려는 마음보다, 오늘 한 번 실천했다는 사실이 더 중요합니다.\n" +
    "- 하루 빠졌더라도 다음 날 바로 복귀하면 루틴은 충분히 유지됩니다.\n" +
    "- 가족이나 지인과 함께 하면 실천율이 높아지고 중도 포기가 줄어듭니다.\n" +
    "- 몸 상태는 매일 다르므로 강도는 고정하지 말고 컨디션에 맞춰 조정하세요.\n" +
    "- 핵심은 빠른 변화가 아니라, 오래 지속되는 생활 습관입니다.\n";

  let out = text;
  while (out.length < min) out += addon;
  if (out.length > max) out = out.slice(0, max - 1) + "…";
  return out;
}

async function main() {
  const rewritten = await findDocsByPrefix("[네이버 재작성]");
  let rewrittenUpdated = 0;
  for (const doc of rewritten) {
    await replaceDocContent(doc.id, fitToAround2000(rewrittenArticle(doc.name)));
    rewrittenUpdated += 1;
  }

  const healthLinks = [];
  for (let i = 0; i < healthTopics.length; i++) {
    const name = `[시니어 건강] ${String(i + 1).padStart(2, "0")}. ${healthTopics[i]}`;
    const d = await ensureDoc(name);
    await replaceDocContent(d.id, fitToAround2000(healthArticle(healthTopics[i], i)));
    healthLinks.push({ name, url: d.webViewLink || `https://docs.google.com/document/d/${d.id}/edit` });
  }

  console.log(JSON.stringify({
    ok: true,
    rewrittenUpdated,
    healthCreatedOrUpdated: healthLinks.length,
    folderUrl: `https://drive.google.com/drive/folders/${TISTORY_FOLDER_ID}`,
    sampleHealthDoc: healthLinks[0],
  }, null, 2));
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message);
  process.exit(1);
});
