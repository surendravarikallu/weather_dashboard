import React, { useState } from 'react';

export interface CompareCitiesProps {
  onCompare: (cityA: string, cityB: string) => void;
}
