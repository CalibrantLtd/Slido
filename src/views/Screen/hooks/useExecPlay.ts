import { onMounted, onUnmounted, ref } from 'vue'
import { throttle } from 'lodash'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { KEYS } from '@/configs/hotkey'
import { ANIMATION_CLASS_PREFIX } from '@/configs/animation'
import message from '@/utils/message'

export default () => {
  const slidesStore = useSlidesStore()
  const { slides, slideIndex, formatedAnimations } = storeToRefs(slidesStore)

  // Current position in element animations for this page
  const animationIndex = ref(0)

  // Animation execution state
  const inAnimation = ref(false)

  // Minimum played page index
  const playedSlidesMinIndex = ref(slideIndex.value)

  // Execute element animations
  const runAnimation = () => {
    // When animations are executing, prevent new animations from starting
    if (inAnimation.value) return

    const { animations, autoNext } = formatedAnimations.value[animationIndex.value]
    animationIndex.value += 1

    // Mark animation execution start
    inAnimation.value = true

    let endAnimationCount = 0

    // Execute all animations at this position sequentially
    for (const animation of animations) {
      const elRef: HTMLElement | null = document.querySelector(`#screen-element-${animation.elId} [class^=base-element-]`)
      if (!elRef) {
        endAnimationCount += 1
        continue
      }

      const animationName = `${ANIMATION_CLASS_PREFIX}${animation.effect}`
      
      // Clear existing animation state before executing (if any)
      elRef.style.removeProperty('--animate-duration')
      for (const classname of elRef.classList) {
        if (classname.indexOf(ANIMATION_CLASS_PREFIX) !== -1) elRef.classList.remove(classname, `${ANIMATION_CLASS_PREFIX}animated`)
      }
      
      // Execute animation
      elRef.style.setProperty('--animate-duration', `${animation.duration}ms`)
      elRef.classList.add(animationName, `${ANIMATION_CLASS_PREFIX}animated`)

      // After animation completes, clear animation state except for exit animations
      const handleAnimationEnd = () => {
        if (animation.type !== 'out') {
          elRef.style.removeProperty('--animate-duration')
          elRef.classList.remove(animationName, `${ANIMATION_CLASS_PREFIX}animated`)
        }

        // When all animations at this position complete, mark animation as done and try to continue (if needed)
        endAnimationCount += 1
        if (endAnimationCount === animations.length) {
          inAnimation.value = false
          if (autoNext) runAnimation()
        }
      }
      elRef.addEventListener('animationend', handleAnimationEnd, { once: true })
    }
  }

  onMounted(() => {
    const firstAnimations = formatedAnimations.value[0]
    if (firstAnimations && firstAnimations.animations.length) {
      const autoExecFirstAnimations = firstAnimations.animations.every(item => item.trigger === 'auto' || item.trigger === 'meantime')
      if (autoExecFirstAnimations) runAnimation()
    }
  })

  // Revoke element animations - move index back and clear animation state
  const revokeAnimation = () => {
    animationIndex.value -= 1
    const { animations } = formatedAnimations.value[animationIndex.value]

    for (const animation of animations) {
      const elRef: HTMLElement | null = document.querySelector(`#screen-element-${animation.elId} [class^=base-element-]`)
      if (!elRef) continue
      
      elRef.style.removeProperty('--animate-duration')
      for (const classname of elRef.classList) {
        if (classname.indexOf(ANIMATION_CLASS_PREFIX) !== -1) elRef.classList.remove(classname, `${ANIMATION_CLASS_PREFIX}animated`)
      }
    }

    // If revoking and this position only has attention animations, revoke again
    if (animations.every(item => item.type === 'attention')) execPrev()
  }

  // Stop auto play
  const autoPlayTimer = ref(0)
  const closeAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = 0
    }
  }
  onUnmounted(closeAutoPlay)

  // Loop playback
  const loopPlay = ref(false)
  const setLoopPlay = (loop: boolean) => {
    loopPlay.value = loop
  }

  const throttleMassage = throttle(function(msg) {
    message.success(msg)
  }, 1000, { leading: true, trailing: false })

  // Play up/down
  // When encountering element animations, play them first; if no animations, flip page
  // When playing up encounters animations, only revoke to pre-animation state - no need to play animations in reverse
  // When reverting to previous page, if page was never played (no animation state), set animation index to minimum (initial state), otherwise set to maximum (final state)
  const execPrev = () => {
    if (formatedAnimations.value.length && animationIndex.value > 0) {
      revokeAnimation()
    }
    else if (slideIndex.value > 0) {
      slidesStore.updateSlideIndex(slideIndex.value - 1)
      if (slideIndex.value < playedSlidesMinIndex.value) {
        animationIndex.value = 0
        playedSlidesMinIndex.value = slideIndex.value
      }
      else animationIndex.value = formatedAnimations.value.length
    }
    else {
      if (loopPlay.value) turnSlideToIndex(slides.value.length - 1)
      else throttleMassage('This is already the first page')
    }
    inAnimation.value = false
  }
  const execNext = () => {
    if (formatedAnimations.value.length && animationIndex.value < formatedAnimations.value.length) {
      runAnimation()
    }
    else if (slideIndex.value < slides.value.length - 1) {
      slidesStore.updateSlideIndex(slideIndex.value + 1)
      animationIndex.value = 0
      inAnimation.value = false
    }
    else {
      if (loopPlay.value) turnSlideToIndex(0)
      else {
        throttleMassage('This is already the last page')
        closeAutoPlay()
      }
      inAnimation.value = false
    }
  }

  // Auto play
  const autoPlayInterval = ref(2500)
  const autoPlay = () => {
    closeAutoPlay()
    message.success('Starting automatic playback')
    autoPlayTimer.value = setInterval(execNext, autoPlayInterval.value)
  }

  const setAutoPlayInterval = (interval: number) => {
    closeAutoPlay()
    autoPlayInterval.value = interval
    autoPlay()
  }

  // Mouse wheel page flip
  const mousewheelListener = throttle(function(e: WheelEvent) {
    if (e.deltaY < 0) execPrev()
    else if (e.deltaY > 0) execNext()
  }, 500, { leading: true, trailing: false })

  // Touch screen swipe to flip pages
  const touchInfo = ref<{ x: number; y: number; } | null>(null)

  const touchStartListener = (e: TouchEvent) => {
    touchInfo.value = {
      x: e.changedTouches[0].pageX,
      y: e.changedTouches[0].pageY,
    }
  }
  const touchEndListener = (e: TouchEvent) => {
    if (!touchInfo.value) return

    const offsetX = Math.abs(touchInfo.value.x - e.changedTouches[0].pageX)
    const offsetY = e.changedTouches[0].pageY - touchInfo.value.y

    if ( Math.abs(offsetY) > offsetX && Math.abs(offsetY) > 50 ) {
      touchInfo.value = null

      if (offsetY > 0) execPrev()
      else execNext()
    }
  }

  // Keyboard shortcut page flip
  const keydownListener = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase()

    if (key === KEYS.UP || key === KEYS.LEFT || key === KEYS.PAGEUP) execPrev()
    else if (
      key === KEYS.DOWN || 
      key === KEYS.RIGHT ||
      key === KEYS.SPACE || 
      key === KEYS.ENTER ||
      key === KEYS.PAGEDOWN
    ) execNext()
  }

  onMounted(() => document.addEventListener('keydown', keydownListener))
  onUnmounted(() => document.removeEventListener('keydown', keydownListener))

  // Switch to previous/next slide (ignoring element entrance animations)
  const turnPrevSlide = () => {
    slidesStore.updateSlideIndex(slideIndex.value - 1)
    animationIndex.value = 0
  }
  const turnNextSlide = () => {
    slidesStore.updateSlideIndex(slideIndex.value + 1)
    animationIndex.value = 0
  }

  // Switch slides to specified page
  const turnSlideToIndex = (index: number) => {
    slidesStore.updateSlideIndex(index)
    animationIndex.value = 0
  }
  const turnSlideToId = (id: string) => {
    const index = slides.value.findIndex(slide => slide.id === id)
    if (index !== -1) {
      slidesStore.updateSlideIndex(index)
      animationIndex.value = 0
    }
  }

  return {
    autoPlayTimer,
    autoPlayInterval,
    setAutoPlayInterval,
    autoPlay,
    closeAutoPlay,
    loopPlay,
    setLoopPlay,
    mousewheelListener,
    touchStartListener,
    touchEndListener,
    turnPrevSlide,
    turnNextSlide,
    turnSlideToIndex,
    turnSlideToId,
    execPrev,
    execNext,
    animationIndex,
  }
}
