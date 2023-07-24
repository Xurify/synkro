export const validateName = (name: string, maxlength: number): { res?: string; ok: boolean } => {
  if (typeof name !== "string") {
    return { res: `Invalid name: ${name}`, ok: false };
  }
  if (name.length > maxlength) {
    return { res: `Name should not be longer than ${maxlength} characters`, ok: false };
  }
  return { ok: true };
};

export const validateRoomId = (id: string | undefined): { res?: string; ok: boolean } => {
  //add length
  if (typeof id !== "string" || id.trim() === "") {
    return { res: `Invalid room id: ${id}`, ok: false };
  }
  return { ok: true };
};

export const validateUserId = (id: string | null): { res?: string; ok: boolean; value?: number } => {
  const parsedId = id && parseInt(id);
  if (!parsedId) {
    return { res: `Invalid user id: ${id}`, ok: false };
  }

  return { ok: true, value: parsedId };
};
