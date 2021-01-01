<template>
  <v-sheet color="#fff4" rounded>
    <v-sheet
      :width="`${progress*100}%`"
      :color="progressColor"
      class="background-transition"
      height="4"
      rounded
    />
  </v-sheet>
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    endTimestamp: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  data: () => ({
    timestamp: Date.now(),
    timestampHandle: null,
  }),
  computed: {
    progress() {
      if (this.endTimestamp === null) return null;
      const progress = 1 - (this.endTimestamp - this.timestamp) / this.duration;
      return _.clamp(progress, 0, 1);
    },
    progressColor() {
      if (this.progress < 0.5) return 'white';
      if (this.progress < 0.75) return 'amber';
      return 'red';
    },
  },
  methods: {
    updateTimestamp() {
      this.timestamp = Date.now();
      this.timestampHandle = requestAnimationFrame(this.updateTimestamp);
    },
  },
  mounted() {
    this.updateTimestamp();
  },
  destroyed() {
    cancelAnimationFrame(this.timestampHandle);
    this.timestampHandle = null;
  },
};
</script>
