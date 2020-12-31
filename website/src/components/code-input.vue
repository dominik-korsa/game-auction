<template>
  <v-text-field
    :value="value"
    @input="$emit('input', $event)"
    placeholder="_____"
    v-mask="'#####'"
    class="code-input"
    filled
    inputmode="numeric"
    hide-details
  />
</template>

<script>
import { mask } from 'vue-the-mask';

export default {
  props: {
    value: {
      default: '',
    },
  },
  directives: {
    mask,
  },
};
</script>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

  .code-input {
    height: fit-content;
    input {
      @media screen and (max-width: 450px) {
        font-size: 48px;
      }

      font-size: 64px;
      letter-spacing: 8px;
      text-align: center;
      font-family: "Roboto Mono", monospace;
      max-height: none !important;
    }
  }
</style>
