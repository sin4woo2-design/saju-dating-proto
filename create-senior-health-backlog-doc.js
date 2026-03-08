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

async function main() {
  const parentId = "16VnD4AOgcpPpZK-81FNRAVFVD3gpuruX"; // 티스토리 폴더
  const title = "[시니어 건강] 2주 주제 백로그 14개";

  const create = await docs.documents.create({ requestBody: { title } });
  const docId = create.data.documentId;

  await drive.files.update({
    fileId: docId,
    addParents: parentId,
    removeParents: "root",
  });

  const lines = [
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

  const text =
    "시니어 건강 콘텐츠 백로그 (2주)\n\n" +
    lines.map((x, i) => `${i + 1}. ${x}`).join("\n") +
    "\n";

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{ insertText: { location: { index: 1 }, text } }],
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        docId,
        docUrl: `https://docs.google.com/document/d/${docId}/edit`,
        folderUrl: `https://drive.google.com/drive/folders/${parentId}`,
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
