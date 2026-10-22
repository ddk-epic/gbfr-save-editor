# Live save units

The game keeps every save unit in memory as a `SaveDataUnit` object wrapping a field of the game's own data. Game code writes those fields directly; no setter runs. Saving copies each unit's live values into the file. Reading the objects gives the save state at any moment, without saving. The `gbfr.dev.savewatch` mod in `mod/` does that.

Addresses are for v2.0.6, `exe+offset` or Ghidra `FUN_14xxxxxxx`. The mod finds the save manager global by a signature on write state 0, `FUN_1408a82b0`, whose `mov rax, [rip+disp32]` at `+0x16` loads it. Decompiles are in `D:/Code Projects/GBFR/dec/save/`.

## Save manager

`[exe+0x71B5E58] + 0x18` is the save manager. It holds four save contexts, `0x228` apart. `+0x0` is the slot data, serialized by write state `0xB`; `+0x228` (37 units, attributes 1 to 452) and `+0x678` (12 units, attributes 901 to 919) hold settings; `+0x450` is unread.

| Offset on a context | Holds                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `+0x00`, `+0x20`    | Registry: count, then a pointer to sorted `{u64 key, SaveDataUnit*}` pairs, one per unit       |
| `+0x40`, `+0x60`    | Count, then sorted `{u64 key, record index}` pairs placing each unit in the serialized records |
| `+0xC8` to `+0xF0`  | Dirty set: a linked list with an FNV-1a hash index over the 8 key bytes                        |
| `+0x100`, `+0x108`  | An `std::map` of units serialized on every save: head node, then size. A few dozen units       |
| `+0x110`            | Serializer output; its `+0x98` is the record array                                             |
| `+0x220`            | Spin lock held while serializing                                                               |

A key is `attribute << 32 | entity`, the unit's identity in the save file. The slot data registry holds every unit the file does, 212,290 in a played save. At the title screen the registry is already full but part of its unit objects are not yet readable, and loading a save rebuilds unit objects without changing the count.

## SaveDataUnit

`SaveDataUnit<T, N>` holds `N` values of `T`. The RTTI names about 45 instantiations, such as `SaveDataUnit<unsigned int, 7>`.

| Offset  | Holds                                                     |
| ------- | --------------------------------------------------------- |
| `+0x00` | vtable                                                    |
| `+0x08` | Mask byte, matched against the serializer's section mask  |
| `+0x10` | Pointer to the live values, inside the owning game object |
| `+0x18` | Shadow copy of the values as last saved                   |

| Slot | Does                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| 0    | Destructor                                                                    |
| 1    | Returns the value type, an index into `VALUE_TYPES` (`uint` is 6)             |
| 2    | Returns `N`                                                                   |
| 3    | Serialize: copies live into shadow, then emits the record via `FUN_140b51040` |
| 4    | Load: copies values into live and shadow                                      |
| 5    | Clears live and shadow                                                        |
| 6    | Copies shadow into live                                                       |
| 7    | Copies live into shadow                                                       |
| 8    | Dirty check: live differs from shadow                                         |
| 9    | Returns the live value pointer                                                |

Slots 1, 2 and 9 are one-instruction bodies (`mov eax, imm32`, `xor eax, eax`, `mov rax, [rcx+disp]`), so a reader decodes a unit class from its vtable's code bytes.

## Registration

A game object registers its units when it is built. `FUN_14045d7c0` is one such function: for each field it takes a `SaveDataUnit` of the matching template from a per-type pool, points `+0x10` at the field, and inserts the key into a set at manager `+0x28`. While manager `+0x8A0` is clear, the live pointer also goes into a set at manager `+0xA8`. The keys there are attribute `0x22CB` (8907) onward at entity 0.

## Save flow

`SaveDataWriteModule` runs a state machine of 22 states, vtables at `exe+0x54E3240` onward, 0x20 apart. State 0 stamps the save time (`FUN_140897200`), then serializes with `FUN_140a14090(context, mask)`: first every dirty unit, removing it from the dirty set, then every unit in the `+0x100` map. Both pass through slot 3. The later states write the files asynchronously.

## Unverified

- `+0x0` as the slot data, from the write state that serializes it.
- Unit classes other than `SaveDataUnit<T, N>`; the reader lists the vtables it cannot decode.
