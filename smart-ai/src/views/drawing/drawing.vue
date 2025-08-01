<template>
  <div class="drawing-wrapper">
    <div class="drawing-left">
      <a-form ref="formRef" :model="formState" :rules="rules">
        <div class="prompt">提示词</div>
        <a-form-item name="prompt">
          <a-textarea
            v-model:value="formState.prompt"
            :rows="4"
            placeholder="请输入提示词，提示词越准确，画图越清晰"
            show-count
            :maxlength="300"
          />
        </a-form-item>
        <div class="prompt">反向提示词</div>
        <a-form-item name="negativePrompt">
          <a-textarea
            v-model:value="formState.negativePrompt"
            :rows="4"
            placeholder="反向提示词"
            show-count
            :maxlength="300"
          />
        </a-form-item>
        <a-form-item label="图片分辨率">
          <a-input-number
            class="number"
            v-model:value="formState.width"
            addon-before="宽"
            min="64"
            max="2048"
            @blur="widthBlur"
          ></a-input-number>
          <a-input-number
            class="number"
            v-model:value="formState.height"
            addon-before="高"
            min="64"
            max="2048"
            @blur="heightBlur"
          ></a-input-number>
        </a-form-item>
        <a-form-item label="数量">
          <a-slider
            v-model:value="formState.batch_size"
            :marks="marks"
            :step="null"
            :min="1"
            :max="4"
          >
            <template #mark="{ label, point }">
              <template v-if="point === 100">
                <strong>{{ label }}</strong>
              </template>
              <template v-else>{{ label }}</template>
            </template>
          </a-slider>
        </a-form-item>
      </a-form>
      <div class="generated" @click="makePicture">生成图片</div>
    </div>
    <div class="drawing-right">
      <div class="progress" v-if="visible">
        <a-progress
          :percent="progress"
          :stroke-color="{
            from: '#108ee9',
            to: '#87d068'
          }"
          status="active"
          :strokeWidth="15"
          :showInfo="false"
        />
        <div>正在生成图片中... {{ progress }}%</div>
      </div>
      <div class="img-wrapper">
        <div v-for="(item, index) in images.length > 0 ? images : currentImage" :key="index">
          <a-image :src="'data:image/png;base64,' + item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue"
import { v4 as uuidv4 } from "uuid"
import drawingApic from "@/api/drawing"

const formRef = ref()
const formState = reactive({
  prompt: "",
  negativePrompt: "",
  width: 512,
  height: 512,
  batch_size: 1
})
const rules = ref({
  prompt: [{ required: true, message: "请输入提示词", trigger: "blur" }]
})

const marks = ref({
  1: "1",
  2: "2",
  3: "3",
  4: "4"
})

const images = ref([])
const currentImage = ref([])
const progress = ref(0)
const task_id = ref("")
const visible = ref(false)
const currentInterval = ref(null)

function widthBlur() {
  if (!formState.width) {
    formState.width = 512
  }
}

function heightBlur() {
  if (!formState.height) {
    formState.height = 512
  }
}

function makePicture() {
  formRef.value
    .validate()
    .then(() => {
      task_id.value = uuidv4()
      let params = { ...formState, ...{ task_id: task_id.value } }
      drawingApic.makePic(params).then((res) => {
        images.value = res.message.images
        clearInterval(currentInterval.value)
        currentInterval.value = null
      })
      currentInterval.value = setInterval(() => {
        drawingApic
          .getProgress({
            task_id: task_id.value
          })
          .then((res) => {
            progress.value = res.message.progress
            if (res.message.currentImage) {
              currentImage.value = []
              currentImage.value.push(res.message.currentImage)
            }
          })
      }, 1500)
    })
    .catch((error) => {
      console.log("error", error)
    })
}
</script>

<style scoped lang="stylus">
.drawing-wrapper
  display flex
  padding 16px 24px
  background #ededf8
  .drawing-left
    flex 1
    min-width 290px
    padding 12px
    background #fff
    .prompt
      margin-bottom 5px
    .number
      margin-bottom 10px
      margin-right 10px
      width: 110px
    .generated
      width 180px
      text-align center
      background #7fce59
      color #fff
      height 35px
      line-height 35px
      border-radius 5px
      cursor pointer
      &:hover
        background #69c03e
  .drawing-right
    flex 2
    display flex
    flex-direction column
    margin-left 10px
    padding 10px
    background #fff
    .progress
      text-align center
      color #949292
    .img-wrapper
      flex 1
      display flex
      align-items center
</style>
