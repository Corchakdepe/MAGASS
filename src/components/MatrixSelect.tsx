import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";

export type MatrixOption = {
  label: string;
  id: number;
};

export type MatrixSelectProps = {
  matrices: MatrixOption[];
  seleccionAgreg: string; // you store selected id as string
  setSeleccionAgreg: (value: string) => void;
};

export function MatrixSelect({
  matrices,
  seleccionAgreg,
  setSeleccionAgreg,
}: MatrixSelectProps) {
  const selected = React.useMemo(
    () => matrices.find((m) => String(m.id) === seleccionAgreg) ?? null,
    [matrices, seleccionAgreg],
  );

  return (
    <div className="space-y-1">
      <Autocomplete<MatrixOption, false, false, false>
        size="small"
        options={matrices}
        getOptionLabel={(option) => option.label}
        value={selected}
        onChange={(_, newValue) => {
          setSeleccionAgreg(newValue ? String(newValue.id) : "");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Selecciona matriz..."
            variant="outlined"
            sx={{ "& .MuiInputBase-input": { fontSize: 12 } }}
          />
        )}
        // NOTE: renderTags is only used when `multiple={true}`.
        // Keeping it here is harmless but unnecessary for single-select. [web:134]
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              label={option.label}
              size="small"
            />
          ))
        }
      />
    </div>
  );
}
