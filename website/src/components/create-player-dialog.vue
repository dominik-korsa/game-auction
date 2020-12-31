<template>
  <v-dialog max-width="600" v-model="value">
    <template #activator="activatorSlot">
      <slot name="activator" v-bind="activatorSlot"/>
    </template>
    <v-card outlined class="play-dialog">
      <v-form @submit.prevent="submit">
        <v-card-title>
          Zagraj w aukcji
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="name"
            label="Nick"
            filled
            autofocus
            counter
            :color="selectedColor"
            maxlength="20"
          />
          <div class="text-subtitle-1">Wybierz kolor</div>
          <v-chip-group
            v-model="selectedColor"
            mandatory
            center-active
            :show-arrows="$vuetify.breakpoint.smAndUp"
          >
            <v-chip
              v-for="color in colors"
              :color="color.value"
              :value="color.value"
              :key="color.value"
              filter
              outlined
              :ripple="false"
            >
              {{ color.name }}
            </v-chip>
          </v-chip-group>
          <v-expand-transition>
            <div v-if="sameColorPlayer !== null">
              <v-alert
                dense
                color="blue"
                text
                icon="mdi-information"
                class="mt-2 mb-0"
              >
                Gracz <b>{{ sameColorPlayer.name }}</b> też wybrał ten kolor
              </v-alert>
            </div>
          </v-expand-transition>
          <template v-if="playersArray.length > 0">
            <v-divider class="my-4" />
            <div class="text-subtitle-1">Kolory innych graczy</div>
            <div class="d-flex flex-wrap py-1">
              <v-chip
                v-for="player in playersArray"
                :key="player.id"
                :color="player.color"
                lass="mr-2 my-1 no-shrink"
              >
                {{ player.name }}
              </v-chip>
            </div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn type="submit" :color="selectedColor" :disabled="!this.valid">Graj</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    socket: {
      type: Object,
      required: true,
    },
    playersArray: {
      type: Array,
      required: true,
    },
  },
  data: () => ({
    value: false,
    selectedColor: '#3f51b5',
    name: '',
    colors: [
      { value: '#3f51b5', name: 'Indygo' },
      { value: '#2196f3', name: 'Niebieski' },
      { value: '#009688', name: 'Morski' },
      { value: '#4caf50', name: 'Zielony' },
      { value: '#ffb300', name: 'Żółty' },
      { value: '#ff5722', name: 'Pomarańczowy' },
      { value: '#f44336', name: 'Czerwony' },
      { value: '#e91e63', name: 'Różowy' },
      { value: '#9c27b0', name: 'Fioletowy' },
    ],
  }),
  computed: {
    sameColorPlayer() {
      return this.playersArray.find((player) => player.color === this.selectedColor) || null;
    },
    valid() {
      return this.name.trim() !== '';
    },
  },
  watch: {
    value: {
      handler(value) {
        if (!value) return;
        const playerString = localStorage.getItem('player');
        if (playerString === null) return;
        const player = JSON.parse(playerString);
        this.selectedColor = player.color;
        this.name = player.name;
      },
      immediate: true,
    },
  },
  methods: {
    submit() {
      if (!this.valid) return;
      const player = {
        color: this.selectedColor.toLowerCase(),
        name: this.name.trim(),
      };
      this.socket.emit('create-player', player);
      localStorage.setItem('player', JSON.stringify(player));
    },
  },
};
</script>

<style lang="scss">
  .play-dialog {
    .no-shrink {
      flex-shrink: 0;
    }
  }
</style>
