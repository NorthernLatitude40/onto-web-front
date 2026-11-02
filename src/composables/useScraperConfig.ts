// useScraperConfig.ts
import {
    createVehicleConfig,
    createVehicleProject,
    deleteVehicleConfig,
    deleteVehicleGroup,
    deleteVehicleProject,
    executeVehicleScrape,
    getVehicleConfigByGroupId,
    getVehicleConfigById,
    getVehicleProjects,
    testVehicleConnection,
    updateVehicleConfig
} from '@/api/vehicles';
import { ref } from 'vue';

export interface ParsingRule {
    id?: string
    name: string
    jsonpath?: string
    css_selector?: string
    xpath?: string
    regex?: string
    output_field: string
    required?: boolean
    // 字段映射 UI 写入的数据
    mappings?: Array<{ source_key: string; target_field: string; model_id?: string }>
    target_model?: string // 每一个解析规则对应的一个目标表模型
}

export interface MultiParserRule {
    id: string
    name: string
    type: 'jsonpath' | 'css' | 'xpath' | 'regex'
    expression: string
    output_field: string
    description?: string
}

export interface Step {
    id: string
    name: string
    mode: 'api' | 'playwright'
    target_url: string
    method: string
    params_json: string
    headers_json: string
    wait_selector?: string
    script?: string
    parsing_rules: ParsingRule[] // 修改为列表形式
    multi_parser_rules: MultiParserRule[]
    delay?: number
    retry_count?: number
    target_model?: string
}

export interface Project {
    id: string | number
    name: string
    description?: string
    created_at?: string
    group?: string
}



// 步骤 id 必须唯一：界面状态是按 id 存的，用 length+1 在删除步骤后会重复
const genStepId = () =>
    `step_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function useScraperConfig() {
    const configs = ref<any[]>([])
    const projects = ref<Project[]>([
        { id: '1', name: '车辆数据爬虫' },
        { id: '2', name: '商品价格监控' },
        { id: '3', name: '新闻文章采集' },
    ])
    const selectedProjectId = ref<string>('1')
    const selectedConfigId = ref<string | null>(null)
    const selectedConfig = ref<any | null>(null)
    const activeTab = ref('basic')
    const isLoading = ref(true)
    const creatingNewConfig = ref(false)
    const message = ref('')
    const messageType = ref<'info' | 'success' | 'error'>('info')
    const jsonpath = ref<string>('')

    // 修改为列表形式的默认解析规则
    const parsing_rules = ref<ParsingRule[]>([
        { name: '默认解析规则', jsonpath: '$.vehicle.name', output_field: 'model_name', target_model: 'pricing_inventory' }
    ])

    const formData = ref({
        name: '',
        target_url: '',
        headers: {},
        timeout: 30,
        is_active: true,
        mode: 'api',
    })

    const steps = ref<Step[]>([
        {
            id: 'step1',
            name: '初始请求',
            mode: 'api',
            target_url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: [
                { name: '默认解析规则', jsonpath: '$.vehicle.name', output_field: 'model_name', target_model: 'pricing_inventory' }
            ],
            multi_parser_rules: [],
        },
    ])

    const globalParsingRules = ref<any>({
        css_selector: '',
        xpath: '',
        regex: '',
        json_schema: JSON.stringify({ type: 'object' }, null, 2),
    })

    // 批量導入相關狀態
    const isImportDialogOpen = ref(false)
    const isImporting = ref(false)
    const importProgress = ref(0)
    const importFile = ref<File | null>(null)
    const importResult = ref<any>(null)

    // 訊息提示
    const setMessage = (msg: string, type: 'info' | 'success' | 'error') => {
        message.value = msg
        messageType.value = type
        setTimeout(() => { message.value = '' }, 5000)
    }
    const showSuccess = (msg: string) => setMessage(msg, 'success')
    const showError = (msg: string) => setMessage(msg, 'error')
    const showInfo = (msg: string) => setMessage(msg, 'info')

    // 重置表單
    const resetForm = () => {
        formData.value = {
            name: '',
            target_url: '',
            headers: {},
            timeout: 30,
            is_active: true,
            mode: 'api',
        }
        steps.value = [{
            id: 'step1',
            name: '初始请求',
            mode: 'api',
            target_url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: [
                { name: '默认解析规则', jsonpath: '$.vehicle.name', output_field: 'model_name', target_model: 'pricing_inventory' }
            ],
            multi_parser_rules: [],
        }]
        globalParsingRules.value = {
            css_selector: '',
            xpath: '',
            regex: '',
            json_schema: JSON.stringify({ type: 'object' }, null, 2),
        }
        jsonpath.value = ''
        parsing_rules.value = [
            { name: '默认解析规则', jsonpath: '$.vehicle.name', output_field: 'model_name', target_model: 'pricing_inventory' }
        ]
    }

    // 載入專案/群組列表
    const fetchProjects = async () => {
        try {
            const res = await getVehicleProjects()
            const data = Array.isArray(res) ? res : []
            if (data.length > 0) {
                projects.value = data
                if (!projects.value.some(p => String(p.id) === selectedProjectId.value)) {
                    selectedProjectId.value = String(projects.value[0].id)
                }
            }
        } catch (error: any) {
            console.warn('加载项目列表失败，使用预设列表:', error?.message)
        }
    }

    let fetchConfigsSeq = 0
    const fetchConfigs = async () => {
        const seq = ++fetchConfigsSeq

        if (!selectedProjectId.value) {
            configs.value = []
            isLoading.value = false
            return
        }

        isLoading.value = true
        try {
            const res = await getVehicleConfigByGroupId(selectedProjectId.value)
            if (seq !== fetchConfigsSeq) return
            configs.value = Array.isArray(res) ? res : (res?.data || [])
            if (!selectedConfigId.value && configs.value.length > 0 && !creatingNewConfig.value) {
                selectedConfigId.value = String(configs.value[0].id);
            }
        } catch (error: any) {
            if (seq !== fetchConfigsSeq) return
            showError('加载配置失败: ' + (error?.message || '未知错误'))
        } finally {
            if (seq === fetchConfigsSeq) isLoading.value = false
        }
    }

    const init = async () => {
        const before = selectedProjectId.value
        await fetchProjects()
        if (selectedProjectId.value === before) {
            await fetchConfigs()
        }
    }

    const createProject = async (payload: { name: string; description?: string }) => {
        try {
            const res = await createVehicleProject(payload)
            const newProject = (res as any)?.data || res || {
                id: String(Date.now()),
                ...payload
            }

            if (!projects.value.some(p => String(p.id) === String(newProject.id))) {
                projects.value.push(newProject)
            }
            selectedProjectId.value = String(newProject.id)

            showSuccess(`成功创建项目：${newProject.name}`)
            return newProject
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || '未知错误'
            showError('创建项目失败: ' + errorMsg)
            throw error
        }
    }

    // 載入單一詳情
    const loadSelectedConfig = async () => {
        const requestedId = selectedConfigId.value
        if (!requestedId) {
            selectedConfig.value = null
            return
        }
        try {
            const res = await getVehicleConfigById(requestedId)
            if (selectedConfigId.value !== requestedId) return

            const data = res?.data || res
            selectedConfig.value = data
            creatingNewConfig.value = false

            formData.value = {
                name: data.name || '',
                target_url: data.target_url || '',
                headers: data.headers || {},
                timeout: data.timeout || 30,
                is_active: data.is_active !== undefined ? data.is_active : true,
                mode: data.mode || 'api',
            }
            if (data.steps?.length > 0) {
                steps.value = data.steps.map((step: any, idx: number) => {
                    // 确保 parsing_rules 转换成数组格式
                    let rules: ParsingRule[] = []
                    if (Array.isArray(step.parsing_rules)) {
                        rules = step.parsing_rules
                    } else if (step.parsing_rules && typeof step.parsing_rules === 'object') {
                        rules = [step.parsing_rules]
                    } else {
                        rules = [{ name: '默认解析规则', jsonpath: '', output_field: 'field' }]
                    }

                    return {
                        ...step,
                        id: step.id || `step${idx + 1}`,
                        name: step.name || '未命名步骤',
                        mode: step.mode || 'api',
                        target_url: step.target_url || '',
                        method: step.method || 'GET',
                        params_json: typeof step.params_json === 'string' ? step.params_json : JSON.stringify(step.params || {}),
                        headers_json: typeof step.headers_json === 'string' ? step.headers_json : JSON.stringify(step.headers || {}),
                        wait_selector: step.wait_selector || '',
                        script: step.script || '',
                        parsing_rules: rules,
                        multi_parser_rules: step.multi_parser_rules || [],
                    }
                })
                const firstRulesArray: ParsingRule[] = steps.value[0]?.parsing_rules || []
                const firstRule = firstRulesArray.length > 0 ? firstRulesArray[0] : null
                jsonpath.value = firstRule?.jsonpath || ''
                parsing_rules.value = firstRulesArray.length > 0 ? firstRulesArray : [{ name: '默认解析规则', jsonpath: '$.vehicle.name', output_field: 'model_name', target_model: 'pricing_inventory' }]
            }
        } catch (error: any) {
            showError('加载配置详情失败: ' + (error?.message || '未知错误'))
        }
    }

    const buildPayload = () => {
        return {
            ...formData.value,
            group_id: selectedProjectId.value,
            steps: steps.value.map(step => ({
                ...step,
                params: (() => {
                    try { return JSON.parse(step.params_json) } catch { return {} }
                })(),
                headers: (() => {
                    try { return JSON.parse(step.headers_json) } catch { return {} }
                })()
            }))
        }
    }

    const saveConfig = async () => {
        try {
            const payload = buildPayload()
            if (creatingNewConfig.value || !selectedConfigId.value) {
                const res = await createVehicleConfig(payload)
                const newConfig = res?.data || res
                showSuccess('创建配置成功')
                creatingNewConfig.value = false
                if (newConfig?.id) {
                    selectedConfigId.value = String(newConfig.id)
                }
                await fetchConfigs()
                if (newConfig?.id) {
                    await loadSelectedConfig()
                }
            } else {
                await updateVehicleConfig(selectedConfigId.value, payload)
                showSuccess('保存配置成功')
                await loadSelectedConfig()
            }
        } catch (error: any) {
            showError('保存配置失败: ' + (error?.message || '未知错误'))
        }
    }

    const executeScrape = async () => {
        if (!selectedConfigId.value) {
            showError('请先选择或保存一个配置再执行爬虫')
            return
        }
        try {
            showInfo('开始执行爬虫任务...')
            const result = await executeVehicleScrape(selectedConfigId.value)
            showSuccess('爬虫任务执行完成')
            return result
        } catch (error: any) {
            showError('执行爬虫失败: ' + (error?.message || '未知错误'))
        }
    }

    const testConnection = async () => {
        if (!selectedConfigId.value) {
            showError('请先选择或保存一个配置再测试连线')
            return
        }
        try {
            showInfo('正在测试连接...')
            const result = await testVehicleConnection(selectedConfigId.value)
            showSuccess('测试连接成功')
            return result
        } catch (error: any) {
            showError('测试连接失败: ' + (error?.message || '未知错误'))
        }
    }

    const deleteConfig = async () => {
        if (!selectedConfigId.value) return
        if (!window.confirm('确定要删除这个爬虫配置吗？')) return

        try {
            await deleteVehicleConfig(selectedConfigId.value)
            showSuccess('删除配置成功')
            selectedConfigId.value = null
            selectedConfig.value = null
            await fetchConfigs()
        } catch (error: any) {
            showError('删除配置失败: ' + (error?.message || '未知错误'))
        }
    }

    const deleteProject = async (projectId: string | number) => {
        if (!window.confirm('确定要删除这个爬虫项目/分组吗？')) return

        try {
            await deleteVehicleProject(projectId)
            projects.value = projects.value.filter(p => String(p.id) !== String(projectId))

            if (String(selectedProjectId.value) === String(projectId)) {
                selectedProjectId.value = projects.value.length > 0 ? String(projects.value[0].id) : ''
                selectedConfigId.value = null
                selectedConfig.value = null
                configs.value = []
            }

            showSuccess('删除项目成功')
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || '未知错误'
            showError('删除项目失败: ' + errorMsg)
            throw error
        }
    }

    const deleteGroup = async (groupName: string) => {
        if (!window.confirm('确定要删除这个分组吗？')) return

        try {
            await deleteVehicleGroup(groupName)
            projects.value = projects.value.filter(p => p.group !== groupName)
            showSuccess('删除分组成功')
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || '未知错误'
            showError('删除分组失败: ' + errorMsg)
            throw error
        }
    }

    const addStep = () => {
        steps.value.push({
            id: genStepId(),
            name: `新步骤 ${steps.value.length + 1}`,
            mode: 'api',
            target_url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: [
                { name: '解析规则', output_field: 'field', target_model: 'pricing_inventory' }
            ],
            multi_parser_rules: [],
        })
    }

    const removeStep = (index: number) => {
        if (steps.value.length <= 1) {
            showError('至少需要保留一个步骤')
            return
        }
        steps.value.splice(index, 1)
    }

    const duplicateStep = (index: number) => {
        const target = steps.value[index]
        const clone = JSON.parse(JSON.stringify(target))
        steps.value.splice(index + 1, 0, {
            ...clone,
            id: genStepId(),
            name: `${target.name} (副本)`
        })
    }

    const addMultiParserRule = (stepIndex: number) => {
        if (!steps.value[stepIndex].multi_parser_rules) {
            steps.value[stepIndex].multi_parser_rules = []
        }
        steps.value[stepIndex].multi_parser_rules.push({
            id: String(Date.now()),
            name: '新多解析规则',
            type: 'jsonpath',
            expression: '',
            output_field: ''
        })
    }

    // 新增：為某個步驟添加一條解析規則（含對應的 target_model）
    const addParsingRuleToStep = (stepIndex: number) => {
        if (!steps.value[stepIndex].parsing_rules) {
            steps.value[stepIndex].parsing_rules = []
        }
        steps.value[stepIndex].parsing_rules.push({
            name: `规则 ${steps.value[stepIndex].parsing_rules.length + 1}`,
            jsonpath: '',
            output_field: '',
            target_model: 'pricing_inventory'
        })
    }

    // 新增：移除某個步驟的特定解析規則
    const removeParsingRuleFromStep = (stepIndex: number, ruleIndex: number) => {
        if (steps.value[stepIndex].parsing_rules.length <= 1) {
            showError('每个步骤至少需要保留一个解析规则')
            return
        }
        steps.value[stepIndex].parsing_rules.splice(ruleIndex, 1)
    }

    const handleDragStart = (e: any) => { }
    const handleDragOver = (e: any) => e.preventDefault()
    const handleDragEnter = (e: any) => { }
    const handleDragEnd = (e: any) => { }
    const handleDrop = (e: any) => { }

    const refreshConfigs = () => {
        fetchConfigs()
        showSuccess('已重新整理配置列表')
    }

    const handleBatchImport = () => {
        isImportDialogOpen.value = true
    }

    const handleFileChange = (e: any) => {
        if (e.target.files?.[0]) {
            importFile.value = e.target.files[0]
        }
    }

    const parseAndImportConfig = async () => {
        if (!importFile.value) {
            showError('请先选择要导入的文件')
            return
        }
        isImporting.value = true
        importProgress.value = 50

        setTimeout(() => {
            isImporting.value = false
            importProgress.value = 100
            importResult.value = { successCount: 1, errorCount: 0, errors: [] }
            showSuccess('批量导入成功')
            isImportDialogOpen.value = false
            fetchConfigs()
        }, 1000)
    }

    const showCreateConfigForm = () => {
        creatingNewConfig.value = true
        selectedConfigId.value = null
        selectedConfig.value = null
        resetForm()
    }

    return {
        configs, projects, selectedProjectId, selectedConfigId, selectedConfig,
        activeTab, isLoading, creatingNewConfig, message, messageType,
        formData, steps, globalParsingRules, jsonpath, parsing_rules,
        isImportDialogOpen, isImporting, importProgress, importFile, importResult,
        init, fetchProjects, createProject, deleteProject, deleteGroup, fetchConfigs, loadSelectedConfig, resetForm,
        showSuccess, showError, showInfo, saveConfig, executeScrape, testConnection,
        deleteConfig, addStep, removeStep, duplicateStep, addMultiParserRule,
        addParsingRuleToStep, removeParsingRuleFromStep, // 導出新增與刪除規則方法
        handleDragStart, handleDragOver, handleDragEnter, handleDragEnd, handleDrop,
        refreshConfigs, handleBatchImport, handleFileChange, parseAndImportConfig, showCreateConfigForm
    }
}