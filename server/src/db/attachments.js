const { getDb } = require('./client');

function insertAttachments(inquiryId, files) {
  if (!files || files.length === 0) return [];

  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO attachments (
      id, inquiry_id, original_name, stored_name, mime_type, size_bytes
    ) VALUES (
      @id, @inquiry_id, @original_name, @stored_name, @mime_type, @size_bytes
    )
  `);

  const saved = [];
  const insertMany = database.transaction((list) => {
    for (const file of list) {
      stmt.run({
        id: file.id,
        inquiry_id: inquiryId,
        original_name: file.originalName,
        stored_name: file.storedName,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
      });
      saved.push(file);
    }
  });

  insertMany(files);
  return saved;
}

function listAttachmentsForInquiry(inquiryId, database = getDb()) {
  if (!inquiryId) return [];
  return database
    .prepare('SELECT * FROM attachments WHERE inquiry_id = ? ORDER BY created_at ASC')
    .all(inquiryId);
}

function getAdminAttachment(inquiryId, attachmentId) {
  return getDb()
    .prepare(
      `SELECT a.*, i.id AS inquiry_exists
       FROM attachments a
       INNER JOIN inquiries i ON i.id = a.inquiry_id
       WHERE a.inquiry_id = ? AND a.id = ?`
    )
    .get(inquiryId, attachmentId);
}

function deleteAttachmentById(attachmentId, database = getDb()) {
  const row = database.prepare('SELECT * FROM attachments WHERE id = ?').get(attachmentId);
  if (!row) return null;
  database.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
  return row;
}

module.exports = {
  insertAttachments,
  listAttachmentsForInquiry,
  getAdminAttachment,
  deleteAttachmentById,
};
