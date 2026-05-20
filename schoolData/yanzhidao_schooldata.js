// 这里负责把独立的数据文件加载到运行时。页面本身不再内嵌大块 JSON，后续只需要维护 data.json。
    // 数据加载完成前，所有渲染入口都不会执行。
    let scData = null;
    let cqData = null;
    let ynData = null;
    let gzData = null;
    let dxData = null;
    let memData = null;

    // 从 data.json 拉取四个城市的 MPA/MBA/MEM 数据，从 dx_data.json 拉取党校数据，从 mem.json 拉取 MEM 数据。
    async function loadData() {
        const [response, dxResponse, memResponse] = await Promise.all([
            fetch('data.json', { cache: 'no-store' }),
            fetch('dx_data.json', { cache: 'no-store' }),
            fetch('mem.json', { cache: 'no-store' })
        ]);
        if (!response.ok) {
            throw new Error('Failed to load data.json: ' + response.status);
        }
        if (!dxResponse.ok) {
            throw new Error('Failed to load dx_data.json: ' + dxResponse.status);
        }
        const data = await response.json();
        scData = data.scData;
        cqData = data.cqData;
        ynData = data.ynData;
        gzData = data.gzData;
        dxData = await dxResponse.json();
        if (memResponse.ok) {
            memData = await memResponse.json();
            if (memData.scData && scData) scData.MEM = memData.scData.MEM;
            if (memData.cqData && cqData) cqData.MEM = memData.cqData.MEM;
            if (memData.ynData && ynData) ynData.MEM = memData.ynData.MEM;
            if (memData.gzData && gzData) gzData.MEM = memData.gzData.MEM;
        }
    }

    function escapeHTML(value) {
        return (value == null ? '' : String(value))
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatText(value) {
        const text = escapeHTML(value);
        if (!text) return '-';
        return text.replace(/\n/g, '<br>');
    }

    // 根据学校和学习方式读取上课方式；如果未配置，返回默认值。
    function getClassTime(regionData, school, prog) {
        if (prog && typeof prog.class_time === 'string' && prog.class_time.trim()) {
            return prog.class_time;
        }
        if (prog && typeof prog.classTime === 'string' && prog.classTime.trim()) {
            return prog.classTime;
        }
        const extensions = regionData && regionData.extensions ? regionData.extensions : {};
        const classTime = extensions.class_time || {};
        const modeMap = classTime.by_school_and_mode && classTime.by_school_and_mode[school.school_name];
        if (modeMap && modeMap[prog.study_mode]) return modeMap[prog.study_mode];
        return (classTime.default_by_school && classTime.default_by_school[school.school_name]) || "";
    }

    // 考试科目里如果出现竖线，统一展示成换行；只改展示，不改 JSON 原值。
    function formatExamSubjects(regionData, value) {
        const text = value == null ? '' : String(value);
        if (!text) return '-';
        return text.replace(/\s*[|｜]\s*/g, '<br>');
    }

    // 25 年分析块：把表头、表体、摘要和备注组装成单个块。
    function renderAdmissionAnalysisBlock(department, analysis) {
        const headers = analysis.headers || ["分数段", "复试人数", "录取人数", "录取率"];
        const sourceRows = analysis.rows || [];
        const columnCount = Math.max(headers.length, ...sourceRows.map(row => row.length), 1);
        const headerHTML = Array.from({ length: columnCount }, (_, index) => `<th>${headers[index] || ''}</th>`).join('');
        const rows = sourceRows.map(row => `
            <tr>
                ${Array.from({ length: columnCount }, (_, index) => `<td>${row[index] || '-'}</td>`).join('')}
            </tr>
        `).join('');
        const extraNotes = (analysis.extraNotes || []).map(note => `
            <div class="admission-analysis-summary">${note}</div>
        `).join('');
        const summary = Array.isArray(analysis.summary) ? analysis.summary.join('；') : analysis.summary;
        const tableHTML = sourceRows.length ? `
                <table>
                    <thead>
                        <tr>${headerHTML}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
        ` : '';

        return `
            <div class="admission-analysis-block">
                <div class="admission-analysis-title">${department} ${analysis.title}</div>
                ${tableHTML}
                ${summary ? `<div class="admission-analysis-summary">${summary}</div>` : ''}
                ${extraNotes}
            </div>
        `;
    }

    // 26 年分析块：按图片提取的表格和备注渲染。
    function renderExam26Block(exam) {
        const headers = exam.headers || ["分数段", "复试人数", "录取人数", "录取率"];
        const rows = exam.rows.map(row => `
            <tr>
                <td>${row[0] || '-'}</td>
                <td>${row[1] || '-'}</td>
                <td>${row[2] || '-'}</td>
                <td>${row[3] || '-'}</td>
            </tr>
        `).join('');
        const summaryItems = (exam.summary || []).map(item => `
            <div class="exam-summary-item">${item}</div>
        `).join('');
        const notes = (exam.notes || []).map(note => `
            <div class="exam-note">${note}</div>
        `).join('');

        return `
            <div class="admission-analysis-block">
                <div class="admission-analysis-title">${exam.department || ''} ${exam.study_mode || ''} ${exam.title}</div>
                <table>
                    <thead>
                        <tr>
                            <th>${headers[0]}</th>
                            <th>${headers[1]}</th>
                            <th>${headers[2]}</th>
                            <th>${headers[3]}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div class="exam-summary-list">${summaryItems}</div>
                ${notes}
            </div>
        `;
    }

    // 在单个学校下，把 25 年与 26 年分析按行配对展示。
    function renderAdmissionAnalysisPanel(regionData, school) {
        const extensions = regionData && regionData.extensions ? regionData.extensions : {};
        const analysisBySchool = extensions.admission_analysis_by_school_department || {};
        const schoolAnalysis = analysisBySchool[school.school_name] || {};
        const exam26BySchool = extensions.exam_26_by_school || {};
        const exam26Blocks = exam26BySchool[school.school_name] || [];
        const blocks25 = Object.keys(schoolAnalysis).flatMap(department => {
            const analyses = Array.isArray(schoolAnalysis[department]) ? schoolAnalysis[department] : [schoolAnalysis[department]];
            return analyses.map(analysis => renderAdmissionAnalysisBlock(department, analysis));
        });
        const blocks26 = exam26Blocks.map(exam => renderExam26Block(exam));

        if (!blocks25.length && !blocks26.length) {
            return '<div class="admission-analysis-empty">暂无拟录取情况分析内容</div>';
        }

        const rowCount = Math.max(blocks25.length, blocks26.length);
        const rows = Array.from({ length: rowCount }, (_, index) => `
            <div class="exam-comparison-row">
                <div class="exam-column">
                    ${blocks25[index] || '<div class="admission-analysis-empty">暂无25年考研情况</div>'}
                </div>
                <div class="exam-column">
                    ${blocks26[index] || '<div class="admission-analysis-empty">暂无26年考研情况</div>'}
                </div>
            </div>
        `).join('');

        return `
            <div class="exam-comparison">
                <div class="exam-comparison-head">
                    <div class="exam-column-title">25年考研情况</div>
                    <div class="exam-column-title">26年考研情况</div>
                </div>
                ${rows}
            </div>
        `;
    }

    // 渲染完成后统一对齐同一行的两侧标题高度，避免左右块错位。
    function alignExamComparisonRows(scope = document) {
        scope.querySelectorAll('.exam-comparison-row').forEach(row => {
            const titles = Array.from(row.querySelectorAll('.admission-analysis-title'));
            if (!titles.length) return;
            titles.forEach(title => {
                title.style.minHeight = '';
            });
            const maxTitleHeight = Math.max(48, ...titles.map(title => title.getBoundingClientRect().height));
            titles.forEach(title => {
                title.style.minHeight = `${Math.ceil(maxTitleHeight)}px`;
            });
        });
    }

    // 基础信息表：逐行渲染专业、方向、学费、招生人数等字段。
    // 这里统一固定列顺序，后续新增城市或院校时也会保持一致。
    function renderPrograms(programs, school, regionData) {
        const groups = [];
        let i = 0;
        while (i < programs.length) {
            const currentDept = programs[i].department;
            let deptSpan = 1;
            while (i + deptSpan < programs.length && programs[i + deptSpan].department === currentDept) {
                deptSpan++;
            }

            const rows = [];
            for (let j = 0; j < deptSpan; j++) {
                const prog = programs[i + j];
                rows.push(`
                    <tr>
                        <td class="col-考试方式">${prog.exam_type}</td>
                        <td class="col-专业">${prog.major}</td>
                        <td class="col-学习方式">${prog.study_mode}</td>
                        <td class="col-学费">${prog.tuition || '-'}</td>
                        <td class="col-上课方式">${getClassTime(regionData, school, prog) || '-'}</td>
                        <td class="col-招生人数">${prog.enrollment}</td>
                        <td class="col-考试科目">${formatExamSubjects(regionData, prog.exam_subjects)}</td>
                        <td class="col-last-year-score">${prog.last_year_score || '-'}</td>
                        <td class="col-this-year-score">${prog.this_year_score || '-'}</td>
                        <td class="col-admission">${prog.admission || '-'}</td>
                        <td class="col-admission-rate">${prog.admission_rate || '-'}</td>
                        <td class="col-退役计划">${prog.veteran_plan}</td>
                        <td class="col-少骨计划">${prog.minority_plan}</td>
                        <td class="col-adjustment">${prog.adjustment || '-'}</td>
                        <td class="col-研究方向">
                            <div class="direction-with-note">
                                <div class="direction-name">${prog.direction}</div>
                                ${prog.notes ? `<div class="direction-note">📝 ${prog.notes}</div>` : ''}
                            </div>
                        </td>
                    </tr>
                `);
            }

            groups.push(`
                <div class="department-table-block">
                    <div class="department-table-title">${currentDept}</div>
                    <div class="department-table-scroll">
                        <table class="ivu-table">
                            <thead>
                                <tr>
                                    <th class="col-考试方式">考试方式</th>
                                    <th class="col-专业">专业</th>
                                    <th class="col-学习方式">学习方式</th>
                                    <th class="col-学费">学费</th>
                                    <th class="col-上课方式">上课方式</th>
                                    <th class="col-招生人数">拟招生人数</th>
                                    <th class="col-考试科目">考试科目</th>
                                    <th class="col-last-year-score">25复试线</th>
                                    <th class="col-this-year-score">26复试线</th>
                                    <th class="col-admission">26录取</th>
                                        <th class="col-admission-rate">录取率</th>
                                        <th class="col-退役计划">退役计划</th>
                                        <th class="col-少骨计划">少骨计划</th>
                                        <th class="col-adjustment">是否调剂</th>
                                        <th class="col-研究方向">研究方向及备注</th>
                                    </tr>
                                </thead>
                            <tbody>${rows.join('')}</tbody>
                        </table>
                    </div>
                </div>
            `);

            i += deptSpan;
        }
        return groups.join('');
    }

    // 学校卡片：把基础信息表和拟录取分析两个标签页拼起来。
    function renderSchool(school, index, regionData) {
        const tagsHTML = school.tags.map(tag => {
            return `<div class="yx-tag">${tag}</div>`;
        }).join('');

        return `
            <div class="zy-item" data-school-index="${index}">
                <div class="yx-total-info">
                    <div class="yx-info">
                        <img src="${school.logo_url}" onerror="this.src='https://t1.chei.com.cn/common/xh/default.jpg'" class="yx-img">
                        <div class="yx-name">(${school.school_code})${school.school_name}</div>
                        <div class="yx-area">${school.location}</div>
                        ${tagsHTML}
                    </div>
                    <button class="toggle-btn" data-table-index="${index}">
                        <span class="btn-icon">+</span>
                        <span class="btn-text">展开</span>
                    </button>
                </div>
                <div class="ivu-table-wrapper" id="table-${index}">
                    <div class="school-detail-tabs">
                        <button type="button" class="detail-tab active" data-panel="basic">基础信息</button>
                        <button type="button" class="detail-tab" data-panel="analysis">拟录取情况分析内容</button>
                    </div>
                    <div class="school-detail-panels">
                        <div class="school-detail-panel basic-info-panel active" data-panel-content="basic">
                            ${renderPrograms(school.programs, school, regionData)}
                        </div>
                        <div class="school-detail-panel admission-analysis" data-panel-content="analysis">
                            ${renderAdmissionAnalysisPanel(regionData, school)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function isSectionRow(row) {
        return row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, 'section');
    }

    function renderDxTable(table, options = {}) {
        const headers = table.headers || [];
        const rows = table.rows || [];
        if (!headers.length || !rows.length) {
            return '<div class="admission-analysis-empty">暂无数据</div>';
        }

        const visibleRows = options.limit ? rows.slice(0, options.limit) : rows;
        const body = visibleRows.map(row => {
            if (isSectionRow(row)) {
                return `<tr class="dx-section-row"><td colspan="${headers.length}">${formatText(row.section)}</td></tr>`;
            }
            if (Array.isArray(row.cells)) {
                return `
                    <tr>
                        ${headers.map((header, index) => `<td>${formatText(row.cells[index])}</td>`).join('')}
                    </tr>
                `;
            }
            return `
                <tr>
                    ${headers.map(header => `<td>${formatText(row[header])}</td>`).join('')}
                </tr>
            `;
        }).join('');

        return `
            <div class="dx-table-scroll">
                <table class="ivu-table dx-table">
                    <thead>
                        <tr>${headers.map(header => `<th>${formatText(header)}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;
    }

    function renderDxOverview(overview) {
        const importantFields = ['学校全称', '性质 / 隶属', '校本部地址', '官方网站', '官方招生网站', '2026 报名直达网址', '咨询电话', '实际认可场景', '核心差异（对比四川）'];
        const rows = overview.filter(item => importantFields.includes(item.field));
        return `
            <div class="dx-overview-grid">
                ${rows.map(item => `
                    <div class="dx-overview-item">
                        <div class="dx-overview-label">${formatText(item.field)}</div>
                        <div class="dx-overview-value">${formatText(item.value)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderDxPrograms(programs, region) {
        if (!programs || !programs.length) {
            return '<div class="admission-analysis-empty">暂无专业数据</div>';
        }

        if (region === 'sc') {
            return `
                <div class="dx-program-grid">
                    ${programs.map(program => `
                        <div class="dx-program-card">
                            <div class="dx-program-title">${formatText(program.major)}</div>
                            <div class="dx-program-meta">计划：${formatText(program.plan)} · 民族专项：${formatText(program.minority_plan)}</div>
                            <div class="dx-program-desc">${formatText(program.direction)}</div>
                            <div class="dx-program-subtitle">25级班级方向</div>
                            <div class="dx-program-desc">${formatText(program.class_directions_2025)}</div>
                            <div class="dx-course-list">
                                ${(program.course_classes || []).map(item => `
                                    <div class="dx-course-item">
                                        <strong>${formatText(item.class_name)}｜${formatText(item.direction)}</strong>
                                        <span>${formatText(item.suitable_positions)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="dx-program-grid">
                ${programs.map(program => `
                    <div class="dx-program-card">
                        <div class="dx-program-title">${formatText(program.major)}</div>
                        <div class="dx-program-meta">计划：${formatText(program.plan)}</div>
                        <div class="dx-program-subtitle">考试科目</div>
                        <div class="dx-program-desc">${formatText(program.exam_subjects)}</div>
                        <div class="dx-program-subtitle">岗位建议</div>
                        <div class="dx-program-desc">${formatText(program.position_advice || program.suitable_positions)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderDxFrontendSummary(frontend) {
        return `
            <div class="dx-summary-grid">
                <div class="dx-summary-item">
                    <span>招生总人数</span>
                    <strong>${formatText(frontend.total_plan)}</strong>
                </div>
                <div class="dx-summary-item">
                    <span>学费</span>
                    <strong>${formatText(frontend.tuition)}</strong>
                </div>
                <div class="dx-summary-item">
                    <span>上课地点</span>
                    <strong>${formatText(frontend.class_location)}</strong>
                </div>
                <div class="dx-summary-item">
                    <span>上课方式</span>
                    <strong>${formatText(frontend.class_mode)}</strong>
                </div>
            </div>
            <div class="dx-display-note">${formatText(frontend.display_note)}</div>
        `;
    }

    function renderDxFrontendPrograms(programs) {
        if (!programs || !programs.length) {
            return '<div class="admission-analysis-empty">暂无专业数据</div>';
        }

        const headers = ['招生专业', '专业培养方向', '各专业人数', '上线人数', '报考录取率', '剔除弃考实考录取率'];
        const rows = programs.map(program => `
            <tr>
                <td>${formatText(program.major)}</td>
                <td>${formatText(program.training_direction)}</td>
                <td>${formatText(program.program_plan)}</td>
                <td>${formatText(program.online_count)}</td>
                <td>
                    <div>${formatText(program.admission_rate)}</div>
                    <div class="dx-muted">最新报考：${formatText(program.applicants_latest)}；录取：${formatText(program.admitted_latest)}</div>
                </td>
                <td>${formatText(program.actual_exam_admission_rate)}</td>
            </tr>
        `).join('');

        return `
            <div class="dx-table-scroll">
                <table class="ivu-table dx-table dx-front-table">
                    <thead>
                        <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    function renderDxFrontendBlocks(blocks) {
        if (!blocks || !blocks.length) return '';
        return `
            <div class="dx-block-grid">
                ${blocks.map(block => `
                    <section class="dx-info-block ${block.type === 'table' ? 'dx-info-block-wide' : ''}">
                        <h3>${formatText(block.title)}</h3>
                        ${block.type === 'table'
                            ? renderDxTable({ headers: block.headers || [], rows: block.rows || [] })
                            : (block.items || []).map(item => `
                                <div class="dx-info-row">
                                    <div class="dx-info-label">${formatText(item.label)}</div>
                                    <div class="dx-info-value">${formatText(item.value)}</div>
                                </div>
                            `).join('')
                        }
                    </section>
                `).join('')}
            </div>
        `;
    }

    function renderDxContent(region) {
        const contentArea = document.getElementById('content-area');
        const data = dxData && dxData.regions ? dxData.regions[region] : null;

        if (!data) {
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>暂无党校数据</h3>
                    <p>当前仅已整理四川、重庆党校数据。</p>
                </div>
            `;
            return;
        }

        const frontend = data.frontend || {};
        contentArea.innerHTML = `
            <div class="zy-item dx-school-card">
                <div class="yx-total-info">
                    <div class="yx-info">
                        <img src="logo-white.png" class="yx-img dx-logo">
                        <div class="yx-name">${formatText(data.school.school_name)}</div>
                        <div class="yx-area">${formatText(data.province)}</div>
                        <div class="yx-tag">党校在职研究生</div>
                        <div class="yx-tag">${formatText(data.data_source)}</div>
                    </div>
                </div>
                <div class="ivu-table-wrapper show dx-wrapper">
                    <div class="school-detail-tabs dx-detail-tabs">
                        <button type="button" class="detail-tab active" data-panel="main">主要信息</button>
                        <button type="button" class="detail-tab" data-panel="blocks">院校分板块</button>
                    </div>
                    <div class="school-detail-panels">
                        <div class="school-detail-panel active" data-panel-content="main">
                            ${renderDxFrontendSummary(frontend)}
                            <div class="department-table-title">招生专业与报录指标</div>
                            ${renderDxFrontendPrograms(frontend.programs || [])}
                        </div>
                        <div class="school-detail-panel" data-panel-content="blocks">
                            ${renderDxFrontendBlocks(frontend.blocks || [])}
                        </div>
                    </div>
                </div>
            </div>
            <div class="stats">
                <p>数据来源：${formatText(data.data_source)}</p>
                <p style="margin-top: 10px;">前台展示 ${frontend.programs.length} 个党校专业 · 完整信息库独立存放于 dx_data.json</p>
            </div>
        `;

        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.stopPropagation();
                const wrapper = this.closest('.ivu-table-wrapper');
                const panel = this.dataset.panel;
                wrapper.querySelectorAll('.detail-tab').forEach(item => item.classList.remove('active'));
                wrapper.querySelectorAll('.school-detail-panel').forEach(item => item.classList.remove('active'));
                this.classList.add('active');
                wrapper.querySelector(`[data-panel-content="${panel}"]`).classList.add('active');
            });
        });
    }

    // 主渲染入口：根据当前地区和标签，选择对应的城市数据并刷新页面。
    function renderContent(region, category) {
        const contentArea = document.getElementById('content-area');

        if (category === 'dx') {
            renderDxContent(region);
            return;
        }
        
        const regionDataMap = {
            sc: scData,
            cq: cqData,
            yn: ynData,
            gz: gzData
        };
        const data = regionDataMap[region] && regionDataMap[region][category.toUpperCase()];

        if (!data) {
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📊</div>
                    <h3>数据正在补充</h3>
                    <p>请耐心等待，补充后会第一时间提示。</p>
                </div>
            `;
            return;
        }

        if (!data.schools || data.schools.length === 0) {
            contentArea.innerHTML = '<div class="empty-state"><div class="icon">📭</div><h3>暂无数据</h3><p>该地区暂无招生信息</p></div>';
            return;
        }

        contentArea.innerHTML = data.schools.map((school, index) => renderSchool(school, index, data)).join('');
        
        const totalPrograms = data.schools.reduce((sum, school) => sum + school.programs.length, 0);
        contentArea.innerHTML += `
            <div class="stats">
                <p>数据来源：${data.data_source}</p>
                <p style="margin-top: 10px;">共展示 ${data.total_schools} 所院校 · ${totalPrograms} 个招生方向 · 完整备注信息</p>
            </div>
        `;

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.tableIndex;
                const tableWrapper = document.getElementById(`table-${index}`);
                const btnIcon = this.querySelector('.btn-icon');
                const btnText = this.querySelector('.btn-text');
                
                tableWrapper.classList.toggle('show');
                
                if (tableWrapper.classList.contains('show')) {
                    btnIcon.textContent = '-';
                    btnText.textContent = '隐藏';
                    requestAnimationFrame(() => alignExamComparisonRows(tableWrapper));
                } else {
                    btnIcon.textContent = '+';
                    btnText.textContent = '展开';
                }
            });
        });

        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.stopPropagation();
                const wrapper = this.closest('.ivu-table-wrapper');
                const panel = this.dataset.panel;
                wrapper.querySelectorAll('.detail-tab').forEach(item => item.classList.remove('active'));
                wrapper.querySelectorAll('.school-detail-panel').forEach(item => item.classList.remove('active'));
                this.classList.add('active');
                wrapper.querySelector(`[data-panel-content="${panel}"]`).classList.add('active');
                requestAnimationFrame(() => alignExamComparisonRows(wrapper));
            });
        });

        document.querySelectorAll('.yx-total-info').forEach(header => {
            header.addEventListener('click', function(e) {
                if (e.target.closest('.toggle-btn')) return;
                const btn = this.querySelector('.toggle-btn');
                if (btn) btn.click();
            });
        });
    }
    // 地区标签切换：切换城市后重绘当前专业类别。
    document.querySelectorAll('.region-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const region = this.dataset.region;
            const category = document.querySelector('.category-tab.active').dataset.category;
            renderContent(region, category);
        });
    });
    // 类别标签切换：在同一城市内切换 MPA / MBA / MEM。
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            const region = document.querySelector('.region-tab.active').dataset.region;
            renderContent(region, category);
        });
    });

    // 窗口尺寸变化时重新对齐分析块，防止换行后左右高度不一致。
    let examComparisonResizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(examComparisonResizeTimer);
        examComparisonResizeTimer = setTimeout(() => alignExamComparisonRows(), 120);
    });
    // 页面启动后先加载数据，再进入默认视图。
    (async function bootstrap() {
        try {
            await loadData();
            renderContent('sc', 'mpa');
        } catch (error) {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>数据加载失败</h3><p>请确认 data.json 可访问。</p></div>';
            }
            console.error(error);
        }
    })();
