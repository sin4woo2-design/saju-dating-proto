import "dotenv/config";
import { google } from "googleapis";

const ROOT_NAME = "사주앱";
const DASHBOARD_NAME = "00_운영대시보드";
const BENCHMARK_DOC_NAME = "사주앱_벤치마크_리포트";
const ROADMAP_DOC_NAME = "사주앱_UI_고도화_계획";
const LOG_SHEET_NAME = "사주앱_개발로그";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });
const docs = google.docs({ version: "v1", auth });
const sheets = google.sheets({ version: "v4", auth });

function esc(s) {
  return s.replace(/'/g, "\\'");
}

async function findFolder(name, parentId) {
  let q = `name='${esc(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureFolder(name, parentId) {
  const found = await findFolder(name, parentId);
  if (found) return found;
  const r = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name,webViewLink",
  });
  return r.data;
}

async function findFile(name, mimeType, parentId) {
  const q = `name='${esc(name)}' and mimeType='${mimeType}' and trashed=false and '${parentId}' in parents`;
  const r = await drive.files.list({ q, fields: "files(id,name,webViewLink)", pageSize: 10 });
  return r.data.files?.[0] || null;
}

async function ensureDoc(name, parentId) {
  const found = await findFile(name, "application/vnd.google-apps.document", parentId);
  if (found) return found;
  const c = await docs.documents.create({ requestBody: { title: name } });
  const id = c.data.documentId;
  await drive.files.update({ fileId: id, addParents: parentId, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/document/d/${id}/edit` };
}

async function ensureSheet(name, parentId) {
  const found = await findFile(name, "application/vnd.google-apps.spreadsheet", parentId);
  if (found) return found;

  const c = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: name },
      sheets: [{ properties: { title: "일자로그" } }, { properties: { title: "백로그" } }, { properties: { title: "릴리즈노트" } }],
    },
  });

  const id = c.data.spreadsheetId;
  await drive.files.update({ fileId: id, addParents: parentId, removeParents: "root" });
  return { id, name, webViewLink: `https://docs.google.com/spreadsheets/d/${id}/edit` };
}

async function replaceDoc(documentId, text) {
  const d = await docs.documents.get({ documentId });
  const content = d.data.body?.content || [];
  const end = content[content.length - 1]?.endIndex || 2;
  const requests = [];
  if (end > 2) {
    requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: end - 1 } } });
  }
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

async function seedSheet(spreadsheetId) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "일자로그!A1:H4",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["날짜", "목표", "작업내용", "변경화면/파일", "결과", "이슈", "다음액션", "소요시간"],
        ["2026-03-08", "경쟁앱 벤치마크", "점신/포스텔러/운세비결 비교", "기획", "초안 완료", "실사용 데이터 부족", "리뷰 분석 보강", "1h"],
        ["2026-03-08", "UI 가독성 개선", "텍스트 위주 화면 시각화", "Home/MySaju/궁합", "1차 반영", "아이콘 에셋 없음", "리소스 추가", "2h"],
        ["2026-03-09", "리텐션 장치", "오늘의 궁합 브리핑", "Home", "예정", "", "구현", ""],
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "백로그!A1:E5",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["기능명", "우선순위", "상태", "담당", "마감"],
        ["궁합 결과 시각화", "P0", "DONE", "용우/AI", "2026-03-08"],
        ["스와이프 카드 액션 저장", "P0", "TODO", "용우/AI", "2026-03-09"],
        ["심화 리포트 유료화 동선", "P1", "TODO", "용우", "2026-03-12"],
        ["A/B 테스트 이벤트 수집", "P1", "TODO", "AI", "2026-03-10"],
      ],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "릴리즈노트!A1:D3",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["버전", "배포일", "주요변경", "회귀이슈"],
        ["v0.1.0", "2026-03-08", "UI 시각화 강화 + 벤치마크 문서화", "없음"],
        ["v0.1.1", "예정", "매칭 액션 저장", ""],
      ],
    },
  });
}

async function main() {
  const root = await ensureFolder(ROOT_NAME);
  const dashboard = await ensureFolder(DASHBOARD_NAME, root.id);

  const benchmarkDoc = await ensureDoc(BENCHMARK_DOC_NAME, dashboard.id);
  const roadmapDoc = await ensureDoc(ROADMAP_DOC_NAME, dashboard.id);
  const logSheet = await ensureSheet(LOG_SHEET_NAME, dashboard.id);

  await replaceDoc(
    benchmarkDoc.id,
    `사주앱 벤치마크 리포트 (점신/포스텔러/운세비결)\n\n` +
      `1. 목적\n` +
      `- 사주 데이팅앱 MVP의 화면/기능/전환 전략 고도화를 위한 레퍼런스 확보\n\n` +
      `2. 공통 강점\n` +
      `- 온보딩이 빠르고 즉시 결과를 제공함\n` +
      `- 다음 콘텐츠 소비 동선(궁합, 상세풀이, 추천)이 자연스러움\n` +
      `- 결제 또는 광고 전환 시점이 명확함\n\n` +
      `3. 앱별 관찰\n` +
      `- 점신: 카테고리 폭이 넓고 반복 방문을 유도하는 구조가 강함\n` +
      `- 포스텔러: 감성 브랜딩/카드형 UI/콘텐츠 포장력이 강함\n` +
      `- 운세비결: 실용형 결과 확인이 빠르고 전통 운세 톤이 선명함\n\n` +
      `4. 우리 앱 반영 포인트\n` +
      `- 텍스트 단락 대신 시각 카드(점수/태그/요약칩) 중심 배치\n` +
      `- 궁합 결과를 강점/주의로 분리해 인지 부하 감소\n` +
      `- 홈 카드에서 '왜 맞는지'를 한눈에 보이는 지표로 표시\n\n` +
      `5. 우선순위\n` +
      `P0: 홈/궁합 화면 시각화 개선\n` +
      `P0: 카드 액션 저장(패스/좋아요)\n` +
      `P1: 심화 리포트 동선 설계\n` +
      `P1: A/B 테스트 이벤트 수집\n`
  );

  await replaceDoc(
    roadmapDoc.id,
    `사주앱 UI 고도화 계획\n\n` +
      `목표\n` +
      `- 텍스트 중심 화면을 카드/지표 중심 UX로 전환해 체감 완성도 향상\n\n` +
      `Phase 1 (완료)\n` +
      `- 홈: 추천 통계 요약 카드 추가\n` +
      `- 인연 카드: 궁합 게이지/핵심포인트 칩 추가\n` +
      `- 내 사주: 상/하위 오행 요약 칩 추가\n` +
      `- 궁합: 원형 점수 뱃지 + 강점/주의 분리 카드화\n\n` +
      `Phase 2 (다음)\n` +
      `- 좋아요/패스 이력 저장 및 다시보기 고도화\n` +
      `- 결과 공유 이미지 카드 템플릿 제작\n` +
      `- 탭별 CTA 최적화 A/B 테스트\n\n` +
      `검증 지표\n` +
      `- 온보딩 완료율\n` +
      `- 홈→궁합 이동률\n` +
      `- 결과 공유 클릭률\n` +
      `- 재방문율(익일)\n`
  );

  await seedSheet(logSheet.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        rootFolder: `https://drive.google.com/drive/folders/${root.id}`,
        dashboardFolder: `https://drive.google.com/drive/folders/${dashboard.id}`,
        benchmarkDoc: benchmarkDoc.webViewLink || `https://docs.google.com/document/d/${benchmarkDoc.id}/edit`,
        roadmapDoc: roadmapDoc.webViewLink || `https://docs.google.com/document/d/${roadmapDoc.id}/edit`,
        logSheet: logSheet.webViewLink || `https://docs.google.com/spreadsheets/d/${logSheet.id}/edit`,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message);
  process.exit(1);
});
