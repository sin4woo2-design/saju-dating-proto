import "dotenv/config";
import { google } from "googleapis";

const DOC_ID = "1rVAf1ue6VlGgZbVe5oWQcEP7uweglF4an6Urch-r-dM";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const docs = google.docs({ version: "v1", auth });

async function getEndIndex(documentId) {
  const d = await docs.documents.get({ documentId });
  const body = d.data.body?.content || [];
  return body[body.length - 1]?.endIndex || 2;
}

async function replaceAll(documentId, text) {
  const end = await getEndIndex(documentId);
  const requests = [];
  if (end > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: end - 1 },
      },
    });
  }
  requests.push({ insertText: { location: { index: 1 }, text } });
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

const content = `제목: 시니어 수면의 질 높이는 저녁 루틴 5분 (밤에 자주 깨는 분들 실전 가이드)\n\n잠을 오래 못 자거나 자주 깨는 날이 이어지면, 낮 컨디션까지 무너지기 쉽습니다.\n특히 시니어 시기에는 수면 문제가 식사, 활동량, 기분, 통증 관리까지 연결되기 때문에 “밤에 잘 자는 것” 자체가 건강관리의 중심이 됩니다.\n\n중요한 건 거창한 방법이 아니라, 오늘 바로 할 수 있는 작은 루틴을 매일 반복하는 것입니다.\n이 글에서는 부담 없이 시작할 수 있는 저녁 5분 루틴을 기준으로, 실제 생활에 붙일 수 있는 방식으로 정리해 보겠습니다.\n\n[이미지1: 저녁 조명 아래 따뜻한 차와 책이 놓인 차분한 침실 분위기]\n\n왜 저녁 루틴이 중요한가\n\n저녁 시간대에 무엇을 하느냐가 잠드는 속도와 수면의 깊이에 직접 영향을 줍니다.\n같은 5분이라도 휴대폰을 보는 5분과 몸을 안정시키는 5분의 결과는 다릅니다.\n\n시니어 수면 관리에서는 특히 아래 3가지를 먼저 잡는 것이 효과적입니다.\n- 취침 전 자극 줄이기(빛, 카페인, 과한 정보)\n- 몸 신호 진정시키기(호흡, 스트레칭, 체온 조절)\n- 잠들기 전 행동 고정하기(매일 같은 순서 반복)\n\n수면의 질 높이는 저녁 루틴 5분\n\n1) 조명 낮추기 (1분)\n취침 30~60분 전부터 방 조명을 한 단계 어둡게 조절하세요.\n밝은 빛은 몸을 “아직 활동 시간”으로 인식하게 만들어 잠드는 시점을 늦출 수 있습니다.\n\n2) 목·어깨 이완 스트레칭 (2분)\n강한 동작보다 천천히 긴장을 푸는 동작이 좋습니다.\n고개를 좌우로 천천히 기울이고, 어깨를 부드럽게 돌리며 숨을 길게 내쉬어 주세요.\n\n3) 4-6 호흡 (1분)\n4초 들이마시고 6초 내쉬는 호흡을 6회 반복합니다.\n숨을 길게 내쉬는 동작은 긴장 완화에 도움이 되어 잠들기 전 과각성을 줄이는 데 유리합니다.\n\n4) 내일 할 일 1줄 메모 (1분)\n잠들기 직전에 떠오르는 걱정을 줄이기 위해 메모를 남기세요.\n“내일 오전에 처리할 일 1개”만 적어도 머릿속 반복 생각을 줄이는 데 도움이 됩니다.\n\n[이미지2: 침대 옆에서 가볍게 스트레칭하는 시니어, 편안한 실내 조명]\n\n시니어 수면 체크리스트\n\n- 카페인 섭취는 늦은 오후 이후 줄였는가\n- 잠들기 전 스마트폰 사용 시간을 줄였는가\n- 방 온도와 이불 상태가 덥거나 춥지 않은가\n- 야식 양을 과하게 먹지 않았는가\n- 오늘 루틴을 5분이라도 실행했는가\n\n실전 팁 (지속률 올리는 방법)\n\n- 처음 1주일은 “완벽”보다 “실행”만 체크하세요.\n- 컨디션이 안 좋은 날엔 루틴 시간을 절반으로 줄여도 됩니다.\n- 하루 놓쳐도 실패가 아닙니다. 다음 날 같은 시간에 바로 재개하면 됩니다.\n\n이런 날은 강도를 낮추세요\n\n- 무릎·허리 통증이 평소보다 심한 날\n- 낮잠이 길어져 밤 리듬이 흔들린 날\n- 불안감, 심한 피로, 두통이 동반되는 날\n\n이때는 루틴을 짧게 하고, 수분 보충과 휴식을 우선하세요.\n증상이 반복되거나 악화되면 의료진 상담이 필요합니다.\n\n자주 묻는 질문\n\nQ. 꼭 5분을 다 해야 하나요?\nA. 아니요. 2~3분만 해도 괜찮습니다. 핵심은 매일 반복입니다.\n\nQ. 루틴을 했는데도 바로 잠이 안 와요.\nA. 정상입니다. 루틴은 “즉시 효과”보다 수면 리듬을 안정시키는 누적 효과가 큽니다. 최소 1~2주 유지해 보세요.\n\nQ. 밤중에 깨면 어떻게 해야 하나요?\nA. 시계를 반복 확인하지 말고, 호흡을 천천히 하며 다시 몸을 이완하는 데 집중하세요. 밝은 화면 노출은 피하는 것이 좋습니다.\n\n결론\n\n시니어 수면 관리는 강한 방법보다, 짧고 반복 가능한 저녁 루틴이 더 현실적입니다.\n오늘은 5분 전체가 아니라 1가지 동작만 골라 시작해도 충분합니다.\n작은 실천이 쌓이면 밤잠의 안정감이 달라지고, 낮 컨디션도 함께 좋아질 수 있습니다.\n\n[이미지3: 편안하게 잠든 시니어의 야간 침실, 안정적인 분위기]\n\n이미지 생성 프롬프트\n\n- 이미지1 프롬프트:\n  "Korean senior-friendly bedroom at evening, warm dim lighting, a cup of herbal tea and a book on bedside table, calm and cozy mood, realistic photo style, no text, no watermark"\n\n- 이미지2 프롬프트:\n  "Senior adult doing gentle neck and shoulder stretching beside bed, soft indoor light, safe and comfortable posture, realistic lifestyle photography, no text"\n\n- 이미지3 프롬프트:\n  "Peaceful night bedroom scene, senior person sleeping comfortably, soft blanket, low warm light, healthy sleep concept, realistic photo, no text"\n\n함께 보면 좋은 글\n\n- 카페인 섭취 마감 시간: 밤잠 살리는 기준\n- 탈수 예방을 위한 시니어 물 마시는 타이밍\n- 불안할 때 3분 호흡법: 긴장 완화 실전편\n\n추천 태그\n시니어수면, 수면루틴, 불면관리, 저녁습관, 건강습관, 시니어건강, 수면의질, 생활건강\n\n※ 안내: 본문은 일반 건강정보이며 진단/치료를 대체하지 않습니다. 증상 지속 시 의료진 상담을 권장합니다.\n`;

replaceAll(DOC_ID, content)
  .then(() => {
    console.log(JSON.stringify({ ok: true, url: `https://docs.google.com/document/d/${DOC_ID}/edit` }, null, 2));
  })
  .catch((e) => {
    console.error("❌ Error:", e.response?.data || e.message);
    process.exit(1);
  });
