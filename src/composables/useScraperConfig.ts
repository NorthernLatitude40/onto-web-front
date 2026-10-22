// useScraperConfig.ts
import {
    createVehicleConfig,
    deleteVehicleConfig,
    executeVehicleScrape,
    getVehicleConfigById,
    getVehicleConfigs,
    testVehicleConnection,
    updateVehicleConfig
} from '@/api/vehicles'
import { ref } from 'vue'

export interface ParsingRule {
    id?: string
    name: string
    jsonpath?: string
    css_selector?: string
    xpath?: string
    regex?: string
    output_field: string
    required?: boolean
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
    url: string
    method: string
    params_json: string
    headers_json: string
    wait_selector?: string
    script?: string
    parsing_rules: ParsingRule | ParsingRule[]
    multi_parser_rules: MultiParserRule[]
    delay?: number
    retry_count?: number
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export function useScraperConfig() {
    const configs = ref<any[]>([])
    const projects = ref([
        { id: '1', name: '车辆数据爬虫' },
        { id: '2', name: '商品价格监控' },
        { id: '3', name: '新闻文章采集' },
    ])
    const selectedProjectId = ref('1')
    const selectedConfigId = ref<string | null>(null)
    const selectedConfig = ref<any | null>(null)
    const activeTab = ref('basic')
    const isLoading = ref(true)
    const creatingNewConfig = ref(false)
    const message = ref('')
    const messageType = ref<'info' | 'success' | 'error'>('info')
    const jsonpath = ref<string>('')

    const formData = ref({
        name: '',
        cron_schedule: '',
        user_agent: DEFAULT_USER_AGENT,
        concurrency: 5,
        timeout: 30,
        proxy: '',
        target_url: '',
    })

    const steps = ref<Step[]>([
        {
            id: 'step1',
            name: '初始请求',
            mode: 'api',
            url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: { name: '默认解析规则', output_field: 'model_name' },
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
            cron_schedule: '',
            user_agent: DEFAULT_USER_AGENT,
            concurrency: 5,
            timeout: 30,
            proxy: '',
            target_url: '',
        }
        steps.value = [{
            id: 'step1',
            name: '初始请求',
            mode: 'api',
            url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: { name: '默认解析规则', output_field: 'model_name' },
            multi_parser_rules: [],
        }]
        globalParsingRules.value = {
            css_selector: '',
            xpath: '',
            regex: '',
            json_schema: JSON.stringify({ type: 'object' }, null, 2),
        }
    }

    // 載入列表
    const fetchConfigs = async () => {
        isLoading.value = true
        try {
            const res = await getVehicleConfigs()
            configs.value = Array.isArray(res) ? res : (res?.data || [])
            if (selectedConfigId.value) {
                await loadSelectedConfig()
            } else if (configs.value.length > 0 && !creatingNewConfig.value) {
                selectedConfigId.value = String(configs.value[0].id)
                await loadSelectedConfig()
            }
        } catch (error: any) {
            showError('加载配置失败: ' + (error?.message || '未知错误'))
        } finally {
            isLoading.value = false
        }
    }

    // 載入單一詳情
    const loadSelectedConfig = async () => {
        if (!selectedConfigId.value) {
            selectedConfig.value = null
            return
        }
        try {
            const res = await getVehicleConfigById(selectedConfigId.value)
            const data = res?.data || res
            selectedConfig.value = data
            creatingNewConfig.value = false

            formData.value = {
                name: data.name || '',
                cron_schedule: data.cron_schedule || '',
                user_agent: data.user_agent || DEFAULT_USER_AGENT,
                concurrency: data.concurrency || 5,
                timeout: data.timeout || 30,
                proxy: data.proxy || '',
                target_url: data.target_url || '',
            }

            if (data.steps?.length > 0) {
                steps.value = data.steps.map((step: any, idx: number) => ({
                    id: step.id || `step${idx + 1}`,
                    name: step.name || '未命名步骤',
                    mode: step.mode || 'api',
                    url: step.target_url || step.url || '',
                    method: step.method || 'GET',
                    params_json: typeof step.params_json === 'string' ? step.params_json : JSON.stringify(step.params || {}),
                    headers_json: typeof step.headers_json === 'string' ? step.headers_json : JSON.stringify(step.headers || {}),
                    wait_selector: step.wait_selector || '',
                    script: step.script || '',
                    parsing_rules: step.parsing_rules || { name: '默认解析规则', output_field: 'model_name' },
                    multi_parser_rules: step.multi_parser_rules || [],
                }))
                jsonpath.value = steps.value[0]?.parsing_rules?.jsonpath || ''
            }
        } catch (error: any) {
            showError('加载配置详情失败: ' + (error?.message || '未知错误'))
        }
    }

    // 組裝 Payload 資料結構以符合後端要求
    const buildPayload = () => {
        return {
            ...formData.value,
            steps: steps.value.map(step => ({
                ...step,
                // 確保 params 與 headers 能夠正確解析為物件送出（若後端需要 JSON 字串則保留字串）
                params: (() => {
                    try { return JSON.parse(step.params_json) } catch { return {} }
                })(),
                headers: (() => {
                    try { return JSON.parse(step.headers_json) } catch { return {} }
                })()
            })),
            global_parsing_rules: globalParsingRules.value
        }
    }

    // 保存配置（支援「建立新配置」或「更新現有配置」）
    const saveConfig = async () => {
        try {
            const payload = buildPayload()
            if (creatingNewConfig.value || !selectedConfigId.value) {
                const newConfig = await createVehicleConfig(payload)
                showSuccess('创建配置成功')
                creatingNewConfig.value = false
                await fetchConfigs()
                if (newConfig?.id) {
                    selectedConfigId.value = String(newConfig.id)
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

    // 執行爬蟲任務
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

    // 測試連線
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

    // 刪除配置
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

    const addStep = () => {
        steps.value.push({
            id: `step${steps.value.length + 1}`,
            name: `新步骤 ${steps.value.length + 1}`,
            mode: 'api',
            url: '',
            method: 'GET',
            params_json: '{}',
            headers_json: '{}',
            parsing_rules: { name: '解析规则', output_field: 'field' },
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
        steps.value.splice(index + 1, 0, {
            ...target,
            id: `step${steps.value.length + 1}`,
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

        // 模擬或可依需求對接對應的檔案上傳 API
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
        formData, steps, globalParsingRules, jsonpath,
        isImportDialogOpen, isImporting, importProgress, importFile, importResult,
        fetchConfigs, loadSelectedConfig, resetForm, showSuccess, showError, showInfo,
        saveConfig, executeScrape, testConnection, deleteConfig,
        addStep, removeStep, duplicateStep, addMultiParserRule,
        handleDragStart, handleDragOver, handleDragEnter, handleDragEnd, handleDrop,
        refreshConfigs, handleBatchImport, handleFileChange, parseAndImportConfig, showCreateConfigForm
    }
}