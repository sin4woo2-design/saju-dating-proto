import "dotenv/config";
import { google } from "googleapis";

const FOLDER_ID = "16VnD4AOgcpPpZK-81FNRAVFVD3gpuruX";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });

const topics = [
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

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function findDocByName(name) {
  const q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.document' and trashed=false and '${FOLDER_ID}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(name) {
  const found = await findDocByName(name);
  if (found) return found;
  const c = await docs.documents.create({ requestBody: { title: name } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: FOLDER_ID, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

async function getEndIndex(documentId) {
  const d = await docs.documents.get({ documentId });
  const body = d.data.body?.content || [];
  return body[body.length - 1]?.endIndex || 2;
}

async function replaceAll(documentId, text) {
  const end = await getEndIndex(documentId);
  const requests = [];
  if (end > 2) requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: end - 1 } } });
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

function body(topic, n) {
  const num = String(n + 1).padStart(2, "0");
  return `제목: ${topic} (시니어 실전 가이드)\n\n` +
`나이가 들수록 건강관리는 “강하게”보다 “꾸준하게”가 더 중요해집니다.\n` +
`특히 시니어 시기에는 수면, 식사, 수분, 활동, 스트레스가 서로 연결되어 있어 한 부분만 흔들려도 하루 컨디션 전체가 영향을 받기 쉽습니다.\n\n` +
`이 글은 복잡한 이론보다 실제 생활에서 바로 적용 가능한 방법만 정리했습니다.\n` +
`처음부터 완벽하게 하려 하지 말고, 오늘 당장 가능한 1~2가지만 먼저 시작해 보세요.\n\n` +
`[이미지1: 시니어 건강한 일상, 차분한 아침 또는 저녁 생활 장면]\n\n` +
`핵심 포인트 5가지\n` +
`1) 시작 기준은 낮게 잡기\n` +
`2) 기존 생활 루틴에 연결하기\n` +
`3) 몸 신호를 보며 강도 조절하기\n` +
`4) 짧게 기록해서 패턴 확인하기\n` +
`5) 하루 놓쳐도 다음 날 바로 복귀하기\n\n` +
`실천 가이드\n` +
`- 하루 5~10분만 확보해도 충분합니다.\n` +
`- 시간을 정해두면 실행률이 올라갑니다(예: 아침 식사 전, 저녁 샤워 전).\n` +
`- 컨디션이 떨어지는 날에는 강도를 낮추고 회복을 우선하세요.\n` +
`- 약 복용 중이거나 기존 질환이 있다면 개인 상태에 맞게 조절하세요.\n\n` +
`시니어 체크리스트\n` +
`- 오늘 목표 1개를 정했는가\n` +
`- 실행 시간을 고정했는가\n` +
`- 끝난 뒤 물 한 잔을 챙겼는가\n` +
`- 통증/어지럼/피로 신호를 확인했는가\n` +
`- 짧게라도 실행 여부를 기록했는가\n\n` +
`[이미지2: 시니어가 무리 없이 가벼운 활동을 하는 장면, 밝고 안정적인 분위기]\n\n` +
`실전 팁\n` +
`- 1주차는 습관 자리 잡기, 2주차는 유지에 집중하세요.\n` +
`- 가족이나 지인과 함께하면 중도 포기가 줄어듭니다.\n` +
`- 결과를 서두르지 말고, 생활 리듬 안정화를 우선 목표로 잡으세요.\n\n` +
`이런 날은 강도를 낮추세요\n` +
`- 전날 수면 부족으로 피로가 큰 날\n` +
`- 무릎·허리 통증이 평소보다 심한 날\n` +
`- 어지럼, 두근거림, 숨참이 느껴지는 날\n\n` +
`이럴 때는 시간을 줄이고 휴식·수분 보충을 먼저 챙기는 편이 안전합니다.\n` +
`증상이 반복되거나 악화되면 의료진 상담이 필요합니다.\n\n` +
`자주 묻는 질문\n` +
`Q. 매일 못 지키면 의미가 없나요?\n` +
`A. 아닙니다. 핵심은 완벽함이 아니라 복귀 속도입니다. 하루 쉬어도 다음 날 다시 시작하면 됩니다.\n\n` +
`Q. 얼마나 해야 효과를 느낄 수 있나요?\n` +
`A. 개인차가 있지만 보통 1~2주만 유지해도 컨디션 변화를 체감하는 경우가 많습니다.\n\n` +
`Q. 가족이 함께 도와줄 수 있는 방법이 있나요?\n` +
`A. 실행 시간을 함께 정하고, 체크리스트를 같이 확인해 주는 것만으로도 큰 도움이 됩니다.\n\n` +
`결론\n` +
`${topic}의 핵심은 큰 변화보다 작은 실천의 반복입니다.\n` +
`오늘은 한 가지 행동만 선택해서 시작해도 충분합니다.\n` +
`꾸준함이 쌓이면 몸 상태와 생활 리듬이 함께 안정됩니다.\n\n` +
`[이미지3: 편안한 표정의 시니어, 건강하고 안정적인 생활 분위기]\n\n` +
`이미지 생성 프롬프트\n` +
`- 이미지1 프롬프트:\n` +
`  "Korean senior healthy lifestyle at home, calm morning or evening routine, warm natural light, realistic photography, no text, no watermark"\n\n` +
`- 이미지2 프롬프트:\n` +
`  "Senior person doing gentle daily health activity safely, bright and comfortable environment, realistic photo style, no text"\n\n` +
`- 이미지3 프롬프트:\n` +
`  "Healthy and relaxed Korean senior portrait in daily life setting, calm and positive mood, realistic photography, no text"\n\n` +
`함께 보면 좋은 글\n` +
`- 카페인 섭취 마감 시간: 밤잠 살리는 기준\n` +
`- 탈수 예방을 위한 시니어 물 마시는 타이밍\n` +
`- 불안할 때 3분 호흡법: 긴장 완화 실전편\n\n` +
`추천 태그\n` +
`시니어건강, 건강습관, 생활건강, 중장년건강, 실천루틴, 건강관리, 일상건강\n\n` +
`※ 안내: 본문은 일반 건강정보이며 진단/치료를 대체하지 않습니다. 증상 지속 시 의료진 상담을 권장합니다.`;
}

function fit2000(text) {
  const min = 1900;
  const max = 2100;
  let out = text;
  const extra = "\n\n추가 메모: 몸 상태에 맞게 조절하면서 천천히 이어가는 것이 장기적으로 가장 효과적입니다.";
  while (out.length < min) out += extra;
  if (out.length > max) out = out.slice(0, max - 1) + "…";
  return out;
}

async function main() {
  const results = [];
  for (let i = 0; i < topics.length; i++) {
    const name = `[시니어 건강] ${String(i + 1).padStart(2, "0")}. ${topics[i]}`;
    const d = await ensureDoc(name);
    const text = fit2000(body(topics[i], i));
    await replaceAll(d.id, text);
    results.push({ name, url: d.webViewLink || `https://docs.google.com/document/d/${d.id}/edit` });
  }
  console.log(JSON.stringify({ ok: true, updated: results.length, sample: results[0] }, null, 2));
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message);
  process.exit(1);
});
