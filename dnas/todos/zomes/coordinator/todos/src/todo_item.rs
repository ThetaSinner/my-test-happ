use hdk::prelude::*;
use todos_integrity::*;
#[hdk_extern]
pub fn create_todo_item(todo_item: TodoItem) -> ExternResult<Record> {
    let todo_item_hash = create_entry(&EntryTypes::TodoItem(todo_item.clone()))?;
    let record = get(todo_item_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created TodoItem"))
            ),
        )?;
    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    create_link(my_agent_pub_key, todo_item_hash.clone(), LinkTypes::MyTodos, ())?;
    Ok(record)
}
#[hdk_extern]
pub fn get_todo_item(
    original_todo_item_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_todo_item_hash.clone(),
        LinkTypes::TodoItemUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_todo_item_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_todo_item_hash.clone(),
    };
    get(latest_todo_item_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateTodoItemInput {
    pub original_todo_item_hash: ActionHash,
    pub previous_todo_item_hash: ActionHash,
    pub updated_todo_item: TodoItem,
}
#[hdk_extern]
pub fn update_todo_item(input: UpdateTodoItemInput) -> ExternResult<Record> {
    let updated_todo_item_hash = update_entry(
        input.previous_todo_item_hash.clone(),
        &input.updated_todo_item,
    )?;
    create_link(
        input.original_todo_item_hash.clone(),
        updated_todo_item_hash.clone(),
        LinkTypes::TodoItemUpdates,
        (),
    )?;
    let record = get(updated_todo_item_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated TodoItem"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_todo_item(
    original_todo_item_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_todo_item_hash)
}
