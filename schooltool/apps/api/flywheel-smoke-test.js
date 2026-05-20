const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8010/api';

async function post(url, data) {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function get(url) {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  const sessionId = `real_user_${Date.now()}`;
  const answers = {
    session_id: sessionId,
    province: '四川',
    system: '公务员',
    goal: '晋升',
    age: '30-35',
    education: '本科',
    budget: 80000,
    work_years: 5,
    study_time: '1h-2h',
    math_base: 'weak'
  };

  await post('/miniapp/events', {
    event_type: 'start_assessment',
    target_type: 'assessment',
    session_id: sessionId,
    payload: { source: 'flywheel_smoke_test' }
  });

  await post('/miniapp/events', {
    event_type: 'finish_assessment',
    target_type: 'assessment',
    session_id: sessionId,
    payload: { answers }
  });

  const recommendation = await post('/miniapp/recommend', answers);
  const firstSchool = recommendation.recommended_schools?.[0];

  if (firstSchool) {
    await post('/miniapp/events', {
      event_type: 'view_school_detail',
      target_type: 'school',
      target_id: firstSchool.id,
      target_name: firstSchool.name,
      session_id: sessionId,
      payload: {
        school_name: firstSchool.name,
        reason: firstSchool.reason
      }
    });

    await post('/miniapp/events', {
      event_type: 'favorite_school',
      target_type: 'school',
      target_id: firstSchool.id,
      target_name: firstSchool.name,
      session_id: sessionId,
      payload: { school_name: firstSchool.name }
    });
  }

  await post('/miniapp/lead', {
    session_id: sessionId,
    phone: '13800000000',
    wechat: 'flywheel-test-user',
    answers,
    recommendation: {
      primary_path: recommendation.primary_path,
      schools: recommendation.recommended_schools
    },
    source: 'flywheel_smoke_test'
  });

  await post('/miniapp/recommendation-feedback', {
    session_id: sessionId,
    action: 'accepted',
    payload: {
      primary_path: recommendation.primary_path,
      selected_school: firstSchool
    }
  });

  const insights = await get('/miniapp/flywheel/insights');
  console.log(JSON.stringify({
    session_id: sessionId,
    recommendation,
    flywheel_summary: insights.summary,
    funnel: insights.funnel,
    product_updates: insights.product_updates.slice(0, 5)
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
