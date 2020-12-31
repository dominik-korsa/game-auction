<template>
  <v-img :src="url" />
</template>

<script>
import QRCode from 'qrcode';

export default {
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    url: null,
  }),
  watch: {
    value: {
      async handler(value) {
        this.url = await QRCode.toDataURL(value, {
          errorCorrectionLevel: 'M',
          scale: 12,
        });
      },
      immediate: true,
    },
  },
};
</script>
