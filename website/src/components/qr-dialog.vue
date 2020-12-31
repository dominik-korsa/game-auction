<template>
  <v-dialog width="fit-content" class="qr-dialog" light>
    <template #activator="activatorSlot">
      <slot v-bind="activatorSlot" name="activator" />
    </template>
    <v-card outlined class="overflow-hidden">
      <h4
        class="text-center text-h5 mt-3 mb-0 font-weight-regular text--black d-block"
      >
        Zeskanuj kod QR
      </h4>
      <qr-code :value="joinUrl" />
      <v-divider />
      <h4
        class="text-center text-h5 my-3 font-weight-regular text--black d-block"
      >
        lub wejdź na <span class="font-weight-medium">{{ address }}</span>
      </h4>
      <h3 class="qr-dialog__code d-block my-3">{{ code }}</h3>
      <v-card-actions>
        <v-btn block color="primary" outlined @click="copyLink">
          <v-icon left>mdi-content-copy</v-icon>
          <v-spacer />
          Skopiuj link
          <v-spacer />
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import QrCode from '@/components/qr-code.vue';

export default {
  components: {
    QrCode,
  },
  props: {
    code: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    address: null,
  }),
  created() {
    const baseUrl = new URL(process.env.VUE_APP_BASE_URL);
    this.address = `${baseUrl.host}${baseUrl.pathname === '/' ? '' : baseUrl.pathname}${baseUrl.search}${baseUrl.hash}`;
  },
  computed: {
    joinUrl() {
      return new URL(`/j/${this.code}`, process.env.VUE_APP_BASE_URL).toString();
    },
  },
  methods: {
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.joinUrl);
      } catch (error) {
        // TODO: Show errors
        console.error(error);
      }
    },
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

.qr-dialog {
  &__code {
    @media screen and (max-width: 450px) {
      font-size: 48px;
    }

    font-size: 64px;
    letter-spacing: 8px;
    text-align: center;
    font-family: "Roboto Mono", monospace;
    font-weight: 400;
    line-height: 1;
  }
}
</style>
