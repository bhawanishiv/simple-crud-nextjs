import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

const CustomIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'color',
})<{
  variant?: 'contained' | 'outlined';
  color?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'warning'
    | 'success'
    | 'inherit'
    | 'default';
}>(({ theme, variant = 'contained', color = 'default' }) => {
  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'success':
        return theme.palette.success.main;
      case 'inherit':
        return 'inherit';
      default:
        return theme.palette.grey[400];
    }
  };

  return {
    color: variant === 'outlined' ? getColor() : theme.palette.common.white,
    border: `1px solid ${getColor()}`,
    borderRadius: theme.shape.borderRadius,
    '&.Mui-disabled': {
      backgroundColor:
        variant === 'outlined' ? 'initial' : theme.palette.grey[100],
      color: theme.palette.action.disabled,
      borderColor: theme.palette.grey[200],
    },
    backgroundColor: variant === 'outlined' ? 'transparent' : getColor(),
    '&:hover': {
      backgroundColor:
        variant === 'outlined'
          ? theme.palette.action.hover
          : color === 'inherit' || color === 'default'
          ? theme.palette.grey[700]
          : theme.palette[color]?.dark || theme.palette.grey[700],
      borderColor:
        color === 'inherit' || color === 'default'
          ? theme.palette.grey[700]
          : theme.palette[color]?.dark || theme.palette.grey[700],
    },
    '& .MuiTouchRipple-root .MuiTouchRipple-child': {
      borderRadius: theme.shape.borderRadius,
    },
  };
});

export default CustomIconButton;
