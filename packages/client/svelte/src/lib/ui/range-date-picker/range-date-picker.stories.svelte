<script context="module" lang="ts">
  import { Story, Template } from '@storybook/addon-svelte-csf'
  import RangeDatePicker, { type RangeDatePickerValue } from './index.svelte'
  import { RELATIVE_RANGES, RichDate } from '@latitude-data/custom_types'
  import { derived, writable } from 'svelte/store'

  export const meta = {
    title: 'RangeDatePicker',
    component: RangeDatePicker
  }
</script>

<script lang="ts">
  const defaultRange = RELATIVE_RANGES['Current month'];
  const defaultValue = {
    start: new RichDate(defaultRange.start),
    end: new RichDate(defaultRange.end)
  };

  const value = writable(defaultValue)
  const label = derived(value, $value => `${$value.start.toString()} - ${$value.end.toString()}`)

  function onChange(e: CustomEvent<RangeDatePickerValue>) {
    const newValue = e.detail
    if (newValue) value.set(newValue)
  }
</script>

<Template let:args>
  <div class="lat-flex lat-flex-col lat-justify-center lat-gap-8">
    <RangeDatePicker value={$value} on:change={onChange} {...args} />
    <div class="lat-flex lat-w-[240px] lat-p-2 lat-rounded-md lat-text-primary-foreground lat-bg-secondary-foreground">
      <div class="lat-ml-4">{$label}</div>
    </div>
  </div>
</Template>

<Story name="Default" />