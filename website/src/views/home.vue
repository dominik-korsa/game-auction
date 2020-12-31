<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center">
    <v-card outlined max-width="600" class="my-3 my-sm-8">
      <div class="d-flex justify-center ma-4">
        <v-btn color="primary" large block to="/create">
          {{ $vuetify.breakpoint.xsOnly ? 'Nowy pokój' : 'Utwórz nowy pokój' }}
        </v-btn>
      </div>
      <div class="mx-8 d-flex align-center">
        <v-divider />
        <div class="mx-4 text--secondary">lub</div>
        <v-divider />
      </div>
      <div class="ma-4">
        <h4 class="text-h5 mb-4 text-center">Dołącz do pokoju</h4>
        <v-form @submit.prevent="onSubmit">
          <code-input v-model="code" />
          <v-btn
            type="submit"
            block
            large
            color="primary"
            class="mt-4"
            :disabled="!codeValid"
          >
            Dołącz
          </v-btn>
        </v-form>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import CodeInput from '@/components/code-input.vue';

export default {
  data: () => ({
    code: '',
  }),
  computed: {
    codeValid() {
      return this.code.length === 5;
    },
  },
  methods: {
    onSubmit() {
      if (!this.codeValid) return;
      this.$router.push(`/j/${this.code}`);
    },
  },
  components: {
    CodeInput,
  },
};
</script>
