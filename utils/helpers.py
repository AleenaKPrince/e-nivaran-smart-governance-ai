def serialize_datetime(document, fields):
    for field in fields:
        if field in document and hasattr(document[field], "isoformat"):
            document[field] = document[field].isoformat()

    return document
