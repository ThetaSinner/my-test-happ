<template>
  <mwc-snackbar ref="update-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Edit Todo Item</span>
      <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Description" :value="description" @input="description = $event.target.value" required></mwc-textarea>
      </div>



    <div style="display: flex; flex-direction: row">
      <mwc-button
        outlined
        label="Cancel"
        @click="$emit('edit-canceled')"
        style="flex: 1; margin-right: 16px;"
      ></mwc-button>
      <mwc-button 
        raised
        label="Save"
        :disabled="!isTodoItemValid"
        @click="updateTodoItem"
        style="flex: 1;"
      ></mwc-button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { TodoItem } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { decode } from '@msgpack/msgpack';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textarea';

export default defineComponent({
  data(): {
    description: string;
  } {
    const currentTodoItem = decode((this.currentRecord.entry as any).Present.entry) as TodoItem;
    return { 
      description: currentTodoItem.description,
    }
  },
  props: {
    originalTodoItemHash: {
      type: null,
      required: true,
    },
    currentRecord: {
      type: Object,
      required: true
    }
  },
  computed: {
    currentTodoItem() {
      return decode((this.currentRecord.entry as any).Present.entry) as TodoItem;
    },
    isTodoItemValid() {
      return true && this.description !== '';
    },
  },
  mounted() {
    if (this.currentRecord === undefined) {
      throw new Error(`The currentRecord input is required for the EditTodoItem element`);
    }
    if (this.originalTodoItemHash === undefined) {
      throw new Error(`The originalTodoItemHash input is required for the EditTodoItem element`);
    }
  },
  methods: {
    async updateTodoItem() {

      const todoItem: TodoItem = { 
        description: this.description,
      };

      try {
        const updateRecord: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'todos',
          zome_name: 'todos',
          fn_name: 'update_todo_item',
          payload: {
            original_todo_item_hash: this.originalTodoItemHash,
            previous_todo_item_hash: this.currentRecord.signed_action.hashed.hash,
            updated_todo_item: todoItem
          }
        });
        this.$emit('todo-item-updated', updateRecord.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['update-error'] as Snackbar;
        errorSnackbar.labelText = `Error updating the todo item: ${e.data.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['todo-item-updated', 'edit-canceled'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
